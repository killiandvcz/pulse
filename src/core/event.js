//event.js

/**
 * @typedef {import('./pulse').Pulse} Pulse
 * @typedef {String} Topic
 */

/**
 * @typedef {Object} EventOptions
 * @property {boolean} silent - If true, the event will not be emitted.
 */

export class Event {
    /**
     * @param {Topic} topic
     * @param {any} data
     * @param {EventOptions} options
     */
    constructor(topic, data, options) {
        this.topic = topic;
        this.data = data;

        this.timestamp = Date.now();
        this.id = `${this.topic}-${this.timestamp}`;

        this.options = {
            silent: false,
            source: null,
            ...options
        };

        this.timedout = false;
        this.response = null;
        this.err = null;
    }


    respond = (data) => {
        if (this.options.silent) {
            return;
        }
        
        this.response = data;
        return this;
    }

    error = (error) => {
        if (this.options.silent) {
            return;
        }
        this.err = error;
        return this;
    }


}