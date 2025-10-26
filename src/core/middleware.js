/**
* @typedef {import('./pulse').Pulse} Pulse
* @typedef {import('./event').Event} Event
*/

/**
* @callback NextCallback
* @param {Event} event
* @returns {Promise<void>}
*/

/**
* @callback MiddlewareCallback
* @param {import('./listener').ListenerContext} context
* @param {NextCallback} next
* @returns {Promise<any>}
*/

export class Middleware {
    /**
    * @param {import('./pulse').Pulse} pulse
    * @param {String} pattern
    * @param {MiddlewareCallback} callback
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
        let patternString = '';
        let i = 0;
        
        while (i < this.pattern.length) {
            if (this.pattern[i] === '.' ) {
                patternString += '\\.';
                i++;
            } else if (this.pattern[i] === ':') {
                patternString += '\\:';
                i++;
            } else if (this.pattern[i] === '*' && this.pattern[i+1] === '*') {
                patternString += '(.*)';
                i += 2;
            } else if (this.pattern[i] === '*') {
                patternString += '([^:]*)';
                i++;
            } else {
                patternString += this.pattern[i];
                i++;
            }
        }
        
        const pattern = new RegExp(`^${patternString}$`);
        return pattern.test(topic);
    }

    destroy() {
        this.pulse.middlewares = this.pulse.middlewares.filter(middleware => middleware !== this);
        this.pulse = null;
        this.pattern = null;
        this.callback = null;
        this.destroy = () => {
            throw new Error('Middleware already destroyed');
        };
    }
}