import { PulseEvent } from './event.js';
import { Listener } from './listener';
import { Middleware } from './middleware';

/**
 * @typedef {Object} PulseOptions
 * @property {typeof PulseEvent} [EventClass] - Custom event class to use (must extend PulseEvent)
 */

export class Pulse {
    /**
     * @param {PulseOptions} [options]
     */
    constructor(options = {}) {
        /** @type {Map<string, Set<import('./listener').Listener>>} */
        this.listeners = new Map();
        /** @type {import('./middleware').Middleware[]} */
        this.middlewares = [];

        this.#patternCache = new Map();

        // Store the EventClass to use (default to PulseEvent)
        this.EventClass = options.EventClass || PulseEvent;

        // Validate that EventClass extends PulseEvent
        if (this.EventClass !== PulseEvent && !(this.EventClass.prototype instanceof PulseEvent)) {
            throw new Error('EventClass must extend PulseEvent');
        }
    }

    /** @type {Map<string, RegExp>} */
    #patternCache;

    /**
     * @param {String} pattern 
     * @param {(context: import('./listener').ListenerContext) => any} callback 
     * @param {import('./listener').ListenerOptions} options 
     */
    on = (pattern, callback, options = {}) => {
        const listener = new Listener(this, pattern, callback, options);
        const patternWithoutWildcards = pattern.replace(/\*/g, "placeholder");
        if (!this.isValidTopic(patternWithoutWildcards)) throw new Error(`Invalid pattern: ${pattern}`);
        if (!this.listeners.has(pattern)) this.listeners.set(pattern, new Set());
        this.listeners.get(pattern)?.add(listener);
        return listener;
    }

    /**
     * @param {String} pattern 
     * @param {(context: import('./listener').ListenerContext) => any} callback 
     * @param {import('./listener').ListenerOptions} options 
     */
    once = (pattern, callback, options = {}) => this.on(pattern, callback, {...options, once: true });

    /**
     * @param {string} pattern 
     * @param {import('./middleware').MiddlewareCallback} callback
     */
    use = (pattern, callback) => {
        const middleware = new Middleware(this, pattern, callback);
        this.middlewares.push(middleware);
        return middleware;
    }

    /**
     * @param {import('./event').PulseEvent} event 
     * @param {import('./listener').Listener} listener
     */
    async applyMiddlewaresToListener(event, listener) {
        const matchingMiddlewares = this.middlewares.filter(middleware => 
            middleware.matches(event.topic)
        );
        
        if (matchingMiddlewares.length === 0) return listener.call(event);
        
        let index = 0;
        
        const next = async () => {
            if (index >= matchingMiddlewares.length) return listener.call(event);
            
            const middleware = matchingMiddlewares[index++];
            if (!middleware) return listener.call(event);
            return middleware.callback({event, pulse: this, listener}, next);
        };
        
        return next();
    }

    /**
     * @param {string} topic
     * @param {any} data
     * @param {{
     * timeout?: number,
     * }} options
     * @returns {Promise<import('./event').PulseEvent>}
     */
    emit = async (topic, data, options = {}) => {
        if (!this.isValidTopic(topic)) {
            throw new Error(`Invalid topic: ${topic}`);
        }


        /** @type {import('./listener').Listener[]} */
        const listeners = [];

        for (const [pattern, patternListeners] of this.listeners.entries()) {
            if (this.#matchPattern(topic, pattern)) {
                listeners.push(...patternListeners);
            }
        }

        const event = new this.EventClass(topic, data, options);

        if (listeners.length === 0) return event;

        const timeout = options?.timeout || 30000;

        const promises = listeners.map(async listener => {
            try {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Listener timed out after ${timeout}ms for topic: ${topic}`));
                    }, timeout);
                });

                return await Promise.race([
                    this.applyMiddlewaresToListener(event, listener),
                    timeoutPromise
                ]);
            } catch (error) {
                console.error('Error occurred while processing listener:', error);
                // Convert unknown error to Error type
                const errorObj = error instanceof Error ? error : new Error(String(error));
                event.error(errorObj);
            }
        });

        await Promise.allSettled(promises)
        return event;

    }

    /**
     * @param {string} pattern 
     * @returns {RegExp}
     */
    #compilePattern(pattern) {
        // Vérifier le cache d'abord
        if (this.#patternCache.has(pattern)) {
            return this.#patternCache.get(pattern) || /.*/;
        }
        
        let regexStr = '^';
        let i = 0;
        
        while (i < pattern.length) {
            // ** = zéro ou plusieurs sections
            if (pattern[i] === '*' && pattern[i + 1] === '*') {
                if (i === 0) {
                    // ** au tout début du pattern
                    if (i + 2 >= pattern.length) {
                        // Juste "**" → match n'importe quoi
                        regexStr += '.*';
                    } else if (pattern[i + 2] === ':') {
                        // "**:something" → match zéro ou plusieurs sections suivies de :something
                        regexStr += '(?:.*:)?';
                        i += 3; // Skip "**:"
                        continue;
                    }
                } else {
                    // ** après d'autres caractères
                    // Retirer le dernier ":" qu'on vient d'ajouter
                    if (regexStr.endsWith('\\:')) {
                        regexStr = regexStr.slice(0, -2);
                    }
                    
                    if (i + 2 >= pattern.length) {
                        // "something:**" → le : et ce qui suit sont optionnels
                        regexStr += '(?::[^:]+(?::[^:]+)*)?';
                    } else if (pattern[i + 2] === ':') {
                        // "something:**:other" → au moins une section entre
                        regexStr += ':[^:]+(?::[^:]+)*';
                    }
                }
                i += 2;
            }
            // * = exactement une section
            else if (pattern[i] === '*') {
                regexStr += '[^:]+';
                i++;
            }
            // : et . doivent être échappés
            else if (pattern[i] === ':' || pattern[i] === '.') {
                regexStr += '\\' + pattern[i];
                i++;
            }
            // Caractère normal
            else {
                regexStr += pattern[i];
                i++;
            }
        }
        
        regexStr += '$';
        const regex = new RegExp(regexStr);
        
        // Mettre en cache
        this.#patternCache.set(pattern, regex);
        
        return regex;
    }

    /**
     * @param {string} topic 
     * @param {string} pattern 
     * @returns {boolean}
     */
    #matchPattern(topic, pattern) {
        const regex = this.#compilePattern(pattern);
        return regex.test(topic);
    }

    /**
     * @param {string} topic 
     * @returns {boolean}
     */
    isValidTopic(topic) {
        const topicRegex = /^[a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*$/;
        return topicRegex.test(topic);
    }

    /**
     * @param {string} topic
     * @param {string} pattern
     * @returns {boolean}
     */
    matchesPattern(topic, pattern) {
        return this.#matchPattern(topic, pattern);
    }

    /**
     * Remove all listeners for a specific pattern
     * @param {string} pattern
     */
    off(pattern) {
        this.listeners.delete(pattern);
    }

    /**
     * Remove all listeners
     */
    removeAllListeners() {
        this.listeners.clear();
    }

}