import {Pattern} from "./pattern.model.js";

/**
 * Manages a collection of event listeners with support for pattern matching.
 * @class
 */
export class Listeners {
    /**
     * Creates a new Listeners instance.
     */
    constructor() {
        /** @type {Map<string, Set<Listener>>} */
        this.listeners = new Map();
    }

    /**
     * Adds a new event listener.
     * @param {string} name - The event name or pattern to listen for
     * @param {Function} callback - The function to call when the event occurs
     * @param {Object} [options={}] - Listener options
     * @param {boolean} [options.once=false] - Whether the listener should only fire once
     * @param {number} [options.priority=0] - Priority level for the listener
     * @returns {Listener} The created listener instance
     */
    add(name, callback, options = {}) {
        if (!this.listeners.has(name)) {
            this.listeners.set(name, new Set());
        }
        const listener = new Listener({name, callback}, options, this);
        this.listeners.get(name).add(listener);
        return listener;
    }

    /**
     * Removes a specific listener for an event.
     * @param {string} name - The event name
     * @param {Listener} listener - The listener instance to remove
     */
    remove(name, listener) {
        if (this.listeners.has(name)) {
            this.listeners.get(name).delete(listener);

            if (this.listeners.get(name).size === 0) {
                this.listeners.delete(name);
            }
        }
    }

    /**
     * Gets all listeners for a specific event.
     * @param {string} name - The event name
     * @returns {Set<Listener>|undefined} Set of listeners or undefined if none exist
     */
    get(name) {
        return this.listeners.get(name);
    }

    /**
     * Checks if listeners exist for a specific event.
     * @param {string} name - The event name
     * @returns {boolean} True if listeners exist for the event
     */
    has(name) {
        return this.listeners.has(name);
    }

    /**
     * Counts listeners, either for a specific event or all events.
     * @param {string} [name] - Optional event name to count listeners for
     * @returns {number} Number of listeners
     */
    count(name) {
        if (name) {
            return this.listeners.has(name) ? this.listeners.get(name).size : 0;
        } else {
            let count = 0;
            for (let listeners of this.listeners.values()) {
                count += listeners.size;
            }
            return count;
        }
    }

    /**
     * Clears listeners, either for a specific event or all events.
     * @param {string} [name] - Optional event name to clear listeners for
     */
    clear(name) {
        if (name) {
            this.listeners.delete(name);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Gets all listeners that match a given event name, sorted by priority.
     * @param {string} eventName - The event name to match against
     * @returns {Listener[]} Array of matching listeners, sorted by priority (highest first)
     */
    getMatchingListeners(eventName) {
        const matching = [];

        for (const [pattern, listeners] of this.listeners) {
            for (const listener of listeners) {
                if (listener.matches(eventName)) {
                    matching.push(listener);
                }
            }
        }

        return matching.sort((a, b) => b.priority - a.priority);
    }
}

/**
 * Represents a single event listener with pattern matching capabilities.
 * @class
 */
export class Listener {
    /**
     * Creates a new Listener instance.
     * @param {{name: string, callback: Function}} params - Base listener parameters
     * @param {Object} [options={}] - Listener options
     * @param {boolean} [options.once=false] - Whether the listener should only fire once
     * @param {number} [options.priority=0] - Priority level for the listener
     * @param {Listeners} listeners - Parent Listeners instance
     */
    constructor({name, callback}, options = {}, listeners) {
        /** @type {string} */
        this.name = name;
        /** @type {Function} */
        this.callback = callback;
        /** @type {Listeners} */
        this.listeners = listeners;
        /** @type {boolean} */
        this.once = options.once || false;
        /** @type {number} */
        this.priority = options.priority || 0;
        /** @type {Symbol} */
        this.id = Symbol("listener");
        /** @type {Pattern|null} */
        this.pattern = name.includes('*') ? new Pattern(name) : null;
    }

    /**
     * Checks if this listener matches a given event name.
     * @param {string} eventName - Event name to check
     * @returns {boolean} True if the listener matches the event name
     */
    matches(eventName) {
        return this.pattern ? this.pattern.matches(eventName) : this.name === eventName;
    }

    /**
     * Calls the listener's callback function.
     * @param {...*} args - Arguments to pass to the callback
     * @returns {Promise<*>} Promise resolving to the callback's return value
     */
    async call(...args) {
        return this.callback(...args);
    }

    /**
     * Removes this listener from its parent Listeners instance.
     */
    remove() {
        this.listeners.remove(this.name, this);
    }
}