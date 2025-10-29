import { Result } from "./result";

export class Event {
    /**
     * @param {string} topic 
     * @param {any} data 
     * @param {Object} [options] 
     * @param {boolean} [options.silent=false] - If true, the event will not collect responses or errors.
     * @param {string|null} [options.source=null] - The source of the event.
     * @param {number} [options.timeout=30000] - The timeout for the event in milliseconds.
     */
    constructor(topic, data, options) {
        this.topic = topic;
        this.data = data;
        this.options = {
            silent: false,
            source: null,
            ...options
        };

        this.timestamp = Date.now();
        this.id = `${this.topic}-${this.timestamp}`;

        /**
         * @type {Result[]}
         */
        this.results = [];
        
        this.context = new Map();
    }

    /**
     * @param {any} data
     */
    respond(data) {
        if (this.options.silent) return;
        const result = new Result(this, data);
        this.results.push(result);
        return result;
    }

    /**
     * @param {Error} err 
     */
    error(err) {
        if (this.options.silent) return;
        const result = new Result(this, err, { error: true });
        this.results.push(result);
        return result;
    }


    /**
     * Set a value in the event context.
     * @param {any} key 
     * @param {any} value 
     */
    set(key, value) {
        this.context.set(key, value);
    }

    /**
     * Get a value from the event context.
     * @param {any} key 
     * @returns 
     */
    get(key) {
        return this.context.get(key);
    }

    /**
     * Check if a key exists in the event context.
     * @param {any} key 
     * @returns {boolean}
     */
    has(key) {
        return this.context.has(key);
    }

    /**
     * Delete a key from the event context.
     * @param {any} key 
     * @returns {boolean}
     */
    delete(key) {
        return this.context.delete(key);
    }

    clear() {
        this.context.clear();
    }
}