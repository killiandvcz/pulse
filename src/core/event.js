/**
 * Base event class for Pulse event system.
 * Can be extended to create custom event types.
 */
export class PulseEvent {
    /**
     * @param {string} topic
     * @param {any} data
     * @param {Object} [options]
     * @param {boolean} [options.silent=false] - If true, the event will not collect responses or errors.
     * @param {string|null} [options.source=null] - The source of the event.
     * @param {number} [options.timeout=30000] - The timeout for the event in milliseconds.
     */
    constructor(topic, data, options = {}) {
        this.topic = topic;
        this.data = data;
        this.options = {
            silent: false,
            source: null,
            timeout: 30000,
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
     * @param {any} data
     * @returns {PulseEvent} Returns this for chaining
     */
    respond(data) {
        if (this.options.silent) return this;
        this.responses.push(data);
        return this;
    }

    /**
     * Add an error to the event
     * @param {Error} err
     * @returns {PulseEvent} Returns this for chaining
     */
    error(err) {
        if (this.options.silent) return this;
        this.errors.push(err);
        return this;
    }
}
