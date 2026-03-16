/**
* @typedef {import('./pulse').Pulse} Pulse
* @typedef {import('./event').PulseEvent} PulseEvent
*/

/**
* @template {PulseEvent} [TEvent=PulseEvent]
* @callback NextCallback
* @returns {Promise<void>}
*/

/**
* @template {PulseEvent} [TEvent=PulseEvent]
* @callback MiddlewareCallback
* @param {import('./listener').ListenerContext<TEvent>} context
* @param {NextCallback<TEvent>} next
* @returns {Promise<any>}
*/

/**
* @template {PulseEvent} [TEvent=PulseEvent]
*/
export class Middleware {
    /**
    * @param {import('./pulse').Pulse} pulse
    * @param {String} pattern
    * @param {MiddlewareCallback<TEvent>} callback
    */
    constructor(pulse, pattern, callback) {
        this.pulse = pulse;
        this.pattern = pattern;
        this.callback = callback;
    }
    
    /**
    * @param {string} topic
    * @returns {boolean}
    */
    matches(topic) {
        return this.pulse.matchesPattern(topic, this.pattern);
    }

    destroy() {
        this.pulse.middlewares = this.pulse.middlewares.filter(middleware => middleware !== this);
        this.destroy = () => {
            throw new Error('Middleware already destroyed');
        };
    }
}