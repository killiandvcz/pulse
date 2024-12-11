import {Listeners} from "./listeners.model.js";
import {Pattern} from "./pattern.model.js";
import {Event} from "./event.model.js";

/**
 * Main event emitter class with middleware and pattern matching support.
 * @class
 */
export class Pulse {
    /**
     * Creates a new Pulse event emitter instance.
     */
    constructor() {
        /** @type {Listeners} Instance managing event listeners */
        this.listeners = new Listeners();

        /** @type {Array<(event: Event) => Promise<void>>} Array of middleware functions */
        this.middlewares = [];
    }

    /**
     * Adds a middleware function to the event processing pipeline.
     * @param {(event: Event) => Promise<void>} middleware - Async function to process events
     * @returns {this} The Pulse instance for chaining
     */
    use(middleware) {
        if (typeof middleware === 'function') {
            this.middlewares.push(middleware);
        }
        return this;
    }

    /**
     * Registers an event listener.
     * @param {string} name - Event name or pattern to listen for
     * @param {(event: Event) => Promise<void>} callback - Function to call when event occurs
     * @param {Object} [options={}] - Listener options
     * @param {boolean} [options.once=false] - Whether listener should only fire once
     * @param {number} [options.priority=0] - Priority level for the listener
     * @returns {import('./listeners.model.js').Listener} The created listener instance
     */
    on(name, callback, options = {}) {
        return this.listeners.add(name, callback, options);
    }

    /**
     * Registers a one-time event listener.
     * @param {string} name - Event name or pattern to listen for
     * @param {(event: Event) => Promise<void>} callback - Function to call when event occurs
     * @param {Object} [options={}] - Additional listener options (excluding 'once')
     * @param {number} [options.priority=0] - Priority level for the listener
     */
    once(name, callback, options = {}) {
        options.once = true;
        this.on(name, callback, options);
    }

    /**
     * Removes a specific listener.
     * @param {import('./listeners.model.js').Listener} listener - The listener to remove
     */
    off(listener) {
        if (listener) {
            listener.remove();
        }
    }

    /**
     * Emits an event, supporting pattern matching for event names.
     * @param {string} name - Event name or pattern to emit
     * @param {Object} [data={}] - Data to pass with the event
     * @returns {Promise<boolean>} False if event was cancelled, true otherwise
     */
    async emit(name, data = {}) {
        if (name.includes("*")) {
            const pattern = new Pattern(name);
            const events = [];

            for (const registeredName of this.listeners.listeners.keys()) {
                if (!registeredName.includes("*") && pattern.matches(registeredName)) {
                    events.push(registeredName);
                }
            }

            const results = await Promise.all(events.map(eventName => this.emitSingle(eventName, data, name)));

            return results.every(result => result);
        }

        return this.emitSingle(name, data);
    }

    /**
     * Emits a single event to all matching listeners.
     * @private
     * @param {string} name - Event name
     * @param {Object} data - Event data
     * @param {string|null} [source=null] - Source event pattern if triggered by pattern matching
     * @returns {Promise<boolean>} False if event was cancelled, true otherwise
     */
    async emitSingle(name, data, source = null) {
        const event = new Event(name, data, source);

        // Execute middlewares
        for (const middleware of this.middlewares) {
            await middleware(event);
            if (event.cancelled) return false;
        }

        const listeners = this.listeners.getMatchingListeners(name);

        // Execute listeners
        for (const listener of listeners) {
            await listener.call(event);

            if (listener.once) {
                listener.remove();
            }

            if (event.cancelled) break;
        }

        return !event.cancelled;
    }

    /**
     * Removes all registered event listeners.
     */
    clear() {
        this.listeners.clear();
    }
}