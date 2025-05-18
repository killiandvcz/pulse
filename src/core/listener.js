// listener.js

/**
* @typedef {import('./pulse').Pulse} Pulse
* @typedef {String} Topic
*/

/**
* @typedef {Object} ListenerOptions
* @property {boolean} once - If true, the listener will be removed after it is called once.
* @property {Object?} autodestroy
* @property {Number} autodestroy.timeout - The time in milliseconds to wait before the listener is removed.
* @property {Number} autodestroy.calls - The number of calls to the listener before it is removed.
* 
*/

export class Listener {
    /** 
    * @param {import('./pulse').Pulse} pulse
    * @param {Topic} topic
    */
    constructor(pulse, topic, callback, options) {
        this.pulse = pulse;
        this.topic = topic;
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
    #callback;
    
    /** @param {import('./event').Event} event */
    callback = async (event) => Promise.resolve(this.#callback(event)).then(res => {
        if (!event.response) event.respond(res);
    }).catch(err => {
        if (!event.error) event.error(err);
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
        const listeners = this.pulse.listeners.get(this.topic).filter(listener => listener !== this);
        if (listeners.length === 0) {
            this.pulse.listeners.delete(this.topic);
        } else {
            this.pulse.listeners.set(this.topic, listeners);
        }
    }
}