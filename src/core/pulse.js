// pulse.js

import { Listener } from "./listener";
import { Event } from "./event";
import { Middleware } from "./middleware";

export class Pulse {
    constructor() {
        this.listeners = new Map();
        this.middlewares = [];
    }
    
    /**
    * @param {String} pattern 
    * @param {(event: (import('./event').Event)) => any} callback 
    * @param {import('./listener').ListenerOptions} options 
    */
    on = (pattern, callback, options = {}) => {
        const listener = new Listener(this, pattern, callback, options);
        const patternWithoutWildcards = pattern.replace(/\*/g, "placeholder");
        if (!this.isValidTopic(patternWithoutWildcards)) {
            throw new Error(`Invalid pattern: ${pattern}`);
        }
        
        if (!this.listeners.has(pattern)) {
            this.listeners.set(pattern, []);
        }
        
        this.listeners.get(pattern).push(listener);
        
        return listener;
    }

    /**
    * @param {String} pattern 
    * @param {(event: (import('./event').Event)) => any} callback 
    * @param {import('./listener').ListenerOptions} options 
    */
    once = (pattern, callback, options = {}) => this.on(pattern, callback, {...options, once: true });
    
    
    /**
    * @param {string} pattern 
    * @param {import("./middleware").MiddlewareCallback} callback
    */
    use = (pattern, callback) => {
        const middleware = new Middleware(this, pattern, callback);
        this.middlewares.push(middleware);
        return middleware;
    }
    
    /**
    * @param {import('./event').Event} event 
    * @param {import('./listener').Listener} listener
    * @returns {Promise<void>}
    */
    async applyMiddlewaresToListener(event, listener) {
        const matchingMiddlewares = this.middlewares.filter(middleware => 
            middleware.matches(event.topic)
        );
        
        if (matchingMiddlewares.length === 0) return listener.callback(event);
        
        let index = 0;
        
        const next = async () => {
            if (index >= matchingMiddlewares.length) return listener.callback(event);
            
            const middleware = matchingMiddlewares[index++];
            return middleware.callback(event, next);
        };
        
        return next();
    }
    
    /**
    * @param {string} topic 
    * @param {any} data 
    * @param {{
    * timeout?: number,
    * }} options
    * @returns 
    */
    emit = async (topic, data, options = {}) => {
        if (!this.isValidTopic(topic)) {
            throw new Error(`Invalid topic: ${topic}`);
        }
        
        /** @type {import('./listener').Listener[]} */
        const listeners = this.listeners.keys().toArray().filter(key => {
            
            let patternString = '';
            let i = 0;
            
            while (i < key.length) {
                if (key[i] === '.' ) {
                    patternString += '\\.';
                    i++;
                } else if (key[i] === ':') {
                    patternString += '\\:';
                    i++;
                } else if (key[i] === '*' && key[i+1] === '*') {
                    patternString += '((?:[^:]*(?:\\:[^:]*)*)?)'
                    i += 2;
                } else if (key[i] === '*') {
                    patternString += '([^:]*)';
                    i++;
                } else {
                    patternString += key[i];
                    i++;
                }
            }
            
            const pattern = new RegExp(`^${patternString}$`);
            const test = pattern.test(topic);
            return test;
        }).map(key => this.listeners.get(key)).flat();
        
        if (listeners.length === 0) {
            return [];
        };
        
        const timeout = options?.timeout || 30000;
        const promises = listeners.map(async listener => {
            const event = new Event(topic, data, {
                source: listener
            });
            
            try {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Event timed out after ${timeout}ms`));
                    }, timeout);
                });
                
                await Promise.race([
                    this.applyMiddlewaresToListener(event, listener),
                    timeoutPromise
                ]);
                
                return event;
            } catch (err) {
                if (!event.err) event.error(err);
                return event;
            }
        });
        
        return await Promise.all(promises);
    }
    
    
    /**
    * Vérifie si un topic est valide (sections séparées par ":")
    * @param {string} topic 
    * @returns {boolean}
    */
    isValidTopic(topic) {
        const topicRegex = /^[a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*$/;
        // return topicRegex.test(topic);
        return true;
    }
    
    /**
    * Supprime un listener pour un pattern donné
    * @param {string} pattern
    */
    off(pattern) {
        if (this.listeners.has(pattern)) {
            this.listeners.delete(pattern);
        }
    }
    
    removeAllListeners() {
        this.listeners.clear();
    }

    removeAllMiddlewares() {
        this.middlewares.forEach(middleware => middleware.destroy());
        this.middlewares = [];
    }

    log = (...args) => console.log('[Pulse]', ...args);
}