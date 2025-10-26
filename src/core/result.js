export class Result {
    /**
     * @param {import('./event').Event} event 
     * @param {any} data 
     * @param {Object} [options] 
     * @param {boolean} [options.error=false] - If true, the result represents an error.
     */
    constructor(event, data, options = {}) {
        this.event = event;
        this.data = data;
        this.options = {
            error: false,
            ...options
        };

        this.timestamp = Date.now();
    }
}