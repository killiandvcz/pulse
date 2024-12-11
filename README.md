# Pulse

A lightweight, pattern-matching event emitter for JavaScript with async support and middleware capabilities.

## Features

- 🎯 Pattern matching with wildcards (`*` and `**`)
- ⚡ Async event handling out of the box
- 🔄 Middleware support for event preprocessing
- 🎨 Clean and intuitive API
- 📦 Zero dependencies
- 💪 Full TypeScript support via JSDoc

## Installation

```bash
npm install @killiandvcz/pulse
```

## Quick Start

```javascript
import { Pulse } from '@killiandvcz/pulse';

// Create a new instance
const pulse = new Pulse();

// Listen to specific events
pulse.on('user:created', async (event) => {
  console.log('User created:', event.data);
});

// Use pattern matching
pulse.on('user:*', async (event) => {
  console.log('User event:', event.name, event.data);
});

// Emit events
await pulse.emit('user:created', { id: 1, name: 'John' });
```

## Pattern Matching

Pulse supports two types of wildcards:
- `*`: Matches any characters except colon
- `**`: Matches any characters including colon

```javascript
// Match all user events
pulse.on('user:*', handler);  // matches 'user:created', 'user:updated', etc.

// Match all events in a namespace
pulse.on('analytics:**', handler);  // matches 'analytics:user:click', 'analytics:page:view', etc.
```

## Middleware

Add middleware functions to process events before they reach listeners:

```javascript
// Add timestamp to all events
pulse.use(async (event) => {
  event.data.timestamp = Date.now();
});

// Cancel specific events
pulse.use(async (event) => {
  if (event.name.startsWith('private:')) {
    event.cancel();
  }
});
```

## API Reference

### `Pulse`

#### Constructor
```javascript
const pulse = new Pulse();
```

#### Methods

##### `on(name, callback, options?)`
Registers an event listener.
- `name`: Event name or pattern
- `callback`: Async function to handle the event
- `options`:
    - `once`: Remove listener after first execution
    - `priority`: Execution priority (higher numbers execute first)

##### `once(name, callback, options?)`
Registers a one-time event listener.

##### `emit(name, data?)`
Emits an event.
- Returns `Promise<boolean>` (false if event was cancelled)

##### `use(middleware)`
Adds a middleware function.
- Middleware signature: `async (event) => void`

##### `off(listener)`
Removes a specific listener.

##### `clear()`
Removes all listeners.

### `Event`

Properties available in event handlers:
- `name`: Event name
- `data`: Event data
- `source`: Original pattern that triggered the event (if applicable)
- `timestamp`: Event creation time
- `cancelled`: Whether the event is cancelled
- `namespace`: Array of namespace parts

## Examples

### Priority Handling

```javascript
// Higher priority listeners execute first
pulse.on('user:*', handler1, { priority: 1 });
pulse.on('user:*', handler2, { priority: 2 }); // Executes before handler1
```

### One-time Listeners

```javascript
// Listen only for the first occurrence
pulse.once('user:created', handler);
```

### Cancelling Events

```javascript
pulse.on('user:delete', async (event) => {
  if (!isAuthorized()) {
    event.cancel();
  }
});
```

### Middleware Example

```javascript
// Add authentication check
pulse.use(async (event) => {
  if (event.name.startsWith('admin:')) {
    if (!isAdmin()) {
      event.cancel();
      console.error('Unauthorized admin action');
    }
  }
});
```

## License

MIT © [Killian Di Vincenzo](https://killiandvcz.fr)
```