/**
* @typedef {Object} ListenerOptions
* @property {boolean} [once] - If true, the listener will be removed after it is called once.
* @property {Object} [autodestroy]
* @property {Number} [autodestroy.timeout] - The time in milliseconds to wait before the listener is removed.
* @property {Number} [autodestroy.calls] - The number of calls to the listener before it is removed.
*/

/**
 * @typedef {Object} ListenerContext
 * @property {import('./pulse').Pulse} pulse
 * @property {import('./event').PulseEvent} event
 * @property {Listener} listener
 */

export class Listener {
    /**
     * @param {import('./pulse').Pulse} pulse 
     * @param {string} pattern 
     * @param {(context: ListenerContext) => void} callback 
     * @param {ListenerOptions} options
     */
    constructor(pulse, pattern, callback, options) {
        this.pulse = pulse;
        this.pattern = pattern;
        this.#callback = callback;
        this.options = options;

        this.calls = 0;
        this.timeout = null;

        if (this.options?.autodestroy?.timeout) {
            this.timeout = setTimeout(() => {
                this.destroy();
            }, this.options.autodestroy.timeout);
        }

        if (this.options?.once) {
            this.options.autodestroy ??= {};
            this.options.autodestroy.calls = 1;
        }
    }

    /** @type {(context: ListenerContext) => any} */
    #callback;

    /** @param {import('./event').PulseEvent} event */
    call = async (event) => Promise.resolve(this.#callback({event, pulse: this.pulse, listener: this})).then(res => {
        // If callback returns a value, automatically add it to responses
        if (res !== undefined && res !== null) {
            event.respond(res);
        }
    }).catch(err => {
        event.error(err);
    }).finally(() => {
        this.calls++;
        if (this.options?.autodestroy?.calls && this.calls >= this.options.autodestroy.calls) {
            this.destroy();
        }
    });

    destroy = () => {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        const set = this.pulse.listeners.get(this.pattern);
        if (set) {
            set.delete(this);
            if (set.size === 0) {
                this.pulse.listeners.delete(this.pattern);
            }
        }
    }
}