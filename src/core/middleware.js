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
* @param {Event} event
* @param {NextCallback} next
* @returns {Promise<Event>}
*/

export class Middleware {
    /**
    * @param {import('./pulse').Pulse} pulse
    * @param {String} pattern
    * @param {(event: (import('./event').Event), next: NextCallback) => any} callback
    */
    constructor(pulse, pattern, callback) {
        this.pulse = pulse;
        this.pattern = pattern;
        this.callback = callback;
    }
    
    /**
    * Vérifie si ce middleware doit être appliqué à un topic
    * @param {string} topic 
    * @returns {boolean}
    */
    matches(topic) {
        // On réutilise la même logique de matching que dans pulse.emit
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
}