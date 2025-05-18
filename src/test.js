import { Pulse } from "./core/pulse";

const pulse = new Pulse();

pulse.use('test:*', async (event, next) => {
    await next(event);
});

pulse.on('**', event => {
    console.log('Event received:', event.data);
    event.respond('Hello, world!');
});

pulse.on('test', event => {
    console.log('Pure test event:', event.data);
    event.respond('pure test response');
});

pulse.on('test:*:bc', event => {
    console.log('Test wildcard event:', event.data);
    event.respond('Test wildcard response');
});

pulse.on('test:a', event => {
    console.log('Test A:', event.data);
    event.respond('Test A response');
});


console.log('Starting Pulse...');

pulse.emit('test:a', { message: 'Hello, Pulse!' }).then(events => {
    events.forEach(event => console.log(event.response));
}).catch(err => {
    console.error('Error:', err);
});