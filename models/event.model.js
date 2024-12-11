/**
 * Represents an event in the event system.
 * @class
 */
export class Event {
    /**
     * Creates a new Event instance.
     * @param {string} name - The event name (can include namespaces separated by ':')
     * @param {Object} [data={}] - Additional data associated with the event
     * @param {*} [source=null] - The source that triggered the event
     */
    constructor(name, data = {}, source = null) {
        /** @type {string} The full event name */
        this.name = name;

        /** @type {Object} Additional event data */
        this.data = data;

        /** @type {*} The source that triggered the event */
        this.source = source;

        /** @type {number} Timestamp when the event was created */
        this.timestamp = Date.now();

        /** @type {boolean} Whether the event has been cancelled */
        this.cancelled = false;

        /** @type {string[]} Array of namespace parts split by ':' */
        this.namespace = name.split(':');
    }

    /**
     * Cancels the event, preventing further processing.
     */
    cancel() {
        this.cancelled = true;
    }

    /**
     * Returns a string representation of the event.
     * @returns {string} String representation of the event
     */
    toString() {
        return `Event(name=${this.name}, source=${this.source || 'direct'})`;
    }
}