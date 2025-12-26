import { Pulse } from './src/core/pulse.js';
import { PulseEvent } from './src/core/event.js';

/**
 * Custom event class with additional properties
 */
class MyCustomEvent extends PulseEvent {
    /**
     * @param {string} topic
     * @param {any} data
     * @param {Object} [options]
     */
    constructor(topic, data, options = {}) {
        super(topic, data, options);

        // Custom properties
        /** @type {string} */
        this.customField = 'This is a custom field';

        /** @type {number} */
        this.priority = 0;
    }

    /**
     * Custom method specific to MyCustomEvent
     * @param {number} priority
     * @returns {MyCustomEvent}
     */
    setPriority(priority) {
        this.priority = priority;
        return this;
    }

    /**
     * Another custom method
     * @returns {string}
     */
    getInfo() {
        return `Event ${this.topic} with priority ${this.priority}`;
    }
}

// Create a Pulse instance with the custom event class
const pulse = new Pulse({ EventClass: MyCustomEvent });

// Now when you use on/once/use, the callback will receive the custom event type!
pulse.on('test:event', ({ event }) => {
    // The IDE should recognize that 'event' is of type MyCustomEvent
    // You should get autocomplete for customField, priority, setPriority, getInfo
    console.log(event.customField);  // ✅ IDE knows about this
    console.log(event.priority);      // ✅ IDE knows about this
    event.setPriority(5);             // ✅ IDE knows about this method
    console.log(event.getInfo());     // ✅ IDE knows about this method

    // And of course, the base PulseEvent properties/methods are still available
    event.respond({ success: true });
});

// The emit method also returns the correct type
const result = await pulse.emit('test:event', { message: 'Hello!' });

// The IDE should know that 'result' is of type MyCustomEvent
console.log(result.customField);  // ✅ IDE knows about this
console.log(result.priority);      // ✅ IDE knows about this
console.log(result.getInfo());     // ✅ IDE knows about this

// Middleware also gets the correct type
pulse.use('test:**', async ({ event }, next) => {
    // event is typed as MyCustomEvent here too!
    event.setPriority(10);
    console.log(event.getInfo());
    await next();
});

console.log('Example completed! Check your IDE autocomplete on the event objects.');
