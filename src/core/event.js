/**
 * Base event class for Pulse event system.
 * Can be extended to create custom event types.
 */
export class PulseEvent {
    /**
     * Private Map to store contextual data
     * @type {Map<any, any>}
     */
    #context = new Map();

    /**
     * @param {string} topic
     * @param {any} data
     * @param {Object} [options]
     * @param {boolean} [options.silent=false] - If true, the event will not collect responses or errors.
     * @param {string|null} [options.source=null] - The source of the event.
     * @param {number} [options.timeout=5000] - The timeout for the event in milliseconds.
     */
    constructor(topic, data, options = {}) {
        this.topic = topic;
        this.data = data;
        this.options = {
            silent: false,
            source: null,
            timeout: 5000,
            ...options
        };

        this.timestamp = Date.now();
        this.id = `${this.topic}-${this.timestamp}`;

        /**
         * @type {any[]}
         */
        this.responses = [];

        /**
         * @type {Error[]}
         */
        this.errors = [];
    }

    /**
     * Add a response to the event
     * @template {PulseEvent} T
     * @this {T}
     * @param {any} data
     * @returns {T} Returns this for chaining
     */
    respond(data) {
        if (this.options.silent) return this;
        this.responses.push(data);
        return this;
    }

    /**
     * Add an error to the event
     * @template {PulseEvent} T
     * @this {T}
     * @param {Error} err
     * @returns {T} Returns this for chaining
     */
    error(err) {
        if (this.options.silent) return this;
        this.errors.push(err);
        return this;
    }

    /**
     * Set a context value
     * @template {PulseEvent} T
     * @this {T}
     * @param {any} key - The key to set
     * @param {any} value - The value to associate with the key
     * @returns {T} Returns this for chaining
     */
    set(key, value) {
        this.#context.set(key, value);
        return this;
    }

    /**
     * Get a context value
     * @param {any} key - The key to retrieve
     * @returns {any} The value associated with the key, or undefined if not found
     */
    get(key) {
        return this.#context.get(key);
    }

    /**
     * Check if a context key exists
     * @param {any} key - The key to check
     * @returns {boolean} True if the key exists in the context
     */
    has(key) {
        return this.#context.has(key);
    }

    /**
     * Delete a context entry
     * @param {any} key - The key to delete
     * @returns {boolean} True if the key existed and was deleted, false otherwise
     */
    delete(key) {
        return this.#context.delete(key);
    }

    /**
     * Clear all context data
     * @template {PulseEvent} T
     * @this {T}
     * @returns {T} Returns this for chaining
     */
    clearContext() {
        this.#context.clear();
        return this;
    }
}
