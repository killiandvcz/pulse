# @killiandvcz/pulse

[![NPM Version](https://img.shields.io/npm/v/@killiandvcz/pulse.svg)](https://www.npmjs.com/package/@killiandvcz/pulse)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@killiandvcz/pulse)](https://bundlephobia.com/package/@killiandvcz/pulse)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> A powerful, lightweight event system with pattern matching, middleware, and timeout support for JavaScript applications.

Pulse is a sophisticated event system that extends beyond basic pub/sub patterns. It provides hierarchical topic structures with support for wildcards, middleware chains, response handling, and automatic timeout management.

## Features

- 🔍 **Hierarchical topic matching** with single (`*`) and deep (`**`) wildcards
- ⚡ **Middleware support** for transforming and filtering events
- ⏱️ **Built-in timeout handling** for asynchronous operations
- 🔄 **Promise-based API** for modern JavaScript applications
- 🧠 **Smart event routing** based on pattern matching
- 💪 **Typed with JSDoc** for excellent IDE integration
- 🪶 **Lightweight** with zero dependencies
- 🧪 **Thoroughly tested** with extensive unit tests

## Installation

```bash
# Using npm
npm install @killiandvcz/pulse

# Using yarn
yarn add @killiandvcz/pulse

# Using pnpm
pnpm add @killiandvcz/pulse

# Using bun
bun add @killiandvcz/pulse
```

## Quick Start

```javascript
import { Pulse } from '@killiandvcz/pulse';

// Create a new Pulse instance
const pulse = new Pulse();

// Subscribe to events
pulse.on('user:created', (event) => {
  console.log(`New user created: ${event.data.username}`);
  event.respond({ success: true });
});

// Subscribe with wildcards
pulse.on('user:*:updated', (event) => {
  console.log(`User property updated: ${event.topic}`);
});

// Add middleware
pulse.use('user:**', async (event, next) => {
  console.log(`[${new Date().toISOString()}] User event: ${event.topic}`);
  // Call next to continue the middleware chain
  await next();
  console.log('Event processing completed');
});

// Emit events
const results = await pulse.emit('user:created', { 
  username: 'john_doe', 
  email: 'john@example.com' 
});

console.log(results[0].response); // { success: true }
```

## Core Concepts

### Topics and Patterns

Topics in Pulse are hierarchical, colon-separated strings:

```
namespace:entity:action
```

For example:
- `user:login`
- `chat:message:sent`
- `system:database:connected`

Listeners can use patterns to match multiple topics:

- `*`: Matches exactly one section
  - `user:*` matches `user:login` and `user:logout` but not `user:profile:view`
  
- `**`: Matches zero or more sections
  - `user:**` matches `user`, `user:login`, and `user:profile:view`
  - `user:**:deleted` matches `user:deleted`, `user:account:deleted`, etc.

### Events

When you emit a topic, Pulse creates an Event object containing:

- `topic`: The emitted topic
- `data`: The payload data
- `response`: Response data (if set by listener)
- `err`: Error information (if an error occurred)
- `timestamp`: When the event was created
- `id`: Unique event identifier

### Middleware

Middleware functions allow for pre/post-processing of events:

```javascript
pulse.use('pattern', async (event, next) => {
  // Pre-processing
  console.log(`Processing ${event.topic}`);
  
  // Continue chain (required to reach listeners)
  await next();
  
  // Post-processing (happens after listener execution)
  console.log(`Response: ${event.response}`);
});
```

## Detailed Usage

### Basic Event Subscription

```javascript
// Basic subscription
pulse.on('topic', (event) => {
  // Handle event
});

// With options
pulse.on('topic', (event) => {
  // Handle event
}, { 
  once: true, // Auto-remove after being called once
  autodestroy: {
    calls: 5,   // Remove after 5 calls
    timeout: 60000  // Remove after 60 seconds
  }
});
```

### Event Emission with Timeout

```javascript
// Basic emission
const results = await pulse.emit('topic', { message: 'Hello World' });

// With timeout (default is 30000ms)
const results = await pulse.emit('topic', data, { timeout: 5000 });
```

### Handling Responses

```javascript
// In listener: set a response
pulse.on('greeting', (event) => {
  return `Hello, ${event.data.name}!`;  // Automatically sets response
  // Or explicitly:
  // event.respond(`Hello, ${event.data.name}!`);
});

// In emitter: get the response
const results = await pulse.emit('greeting', { name: 'John' });
console.log(results[0].response);  // "Hello, John!"
```

### Error Handling

```javascript
// In listener: handle errors
pulse.on('process', (event) => {
  try {
    // Do something that might fail
  } catch (err) {
    event.error(err);
  }
});

// In emitter: check for errors
const results = await pulse.emit('process', data);
if (results[0].err) {
  console.error('Error occurred:', results[0].err);
}
```

### Middleware Chains

```javascript
// Authentication middleware
pulse.use('secure:**', async (event, next) => {
  if (!event.data.token) {
    event.error(new Error('Authentication required'));
    return; // Don't call next() to stop the chain
  }
  
  // Validate token
  const user = validateToken(event.data.token);
  if (!user) {
    event.error(new Error('Invalid token'));
    return;
  }
  
  // Add user to event data for downstream handlers
  event.data.user = user;
  
  // Continue the middleware chain
  await next();
});

// Logging middleware
pulse.use('**', async (event, next) => {
  console.time(`event:${event.id}`);
  await next();
  console.timeEnd(`event:${event.id}`);
});
```

### Cleaning Up

```javascript
// Remove a specific listener
const listener = pulse.on('topic', callback);
listener.destroy();

// Remove all listeners for a topic
pulse.off('topic');

// Remove all listeners
pulse.removeAllListeners();
```

## API Reference

### Pulse Class

#### Constructor

```javascript
const pulse = new Pulse();
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on` | `pattern: string`, `callback: Function`, `options?: Object` | `Listener` | Subscribe to events matching the pattern |
| `use` | `pattern: string`, `callback: Function` | `Middleware` | Add middleware for events matching the pattern |
| `emit` | `topic: string`, `data: any`, `options?: Object` | `Promise<Event[]>` | Emit an event with the specified topic and data |
| `off` | `pattern: string` | `void` | Remove all listeners for a pattern |
| `removeAllListeners` | | `void` | Remove all listeners |

#### Listener Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `once` | `boolean` | `false` | If true, the listener will be removed after it is called once |
| `autodestroy.calls` | `number` | `undefined` | Number of calls after which the listener is removed |
| `autodestroy.timeout` | `number` | `undefined` | Time in milliseconds after which the listener is removed |

#### Emit Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `30000` | Time in milliseconds to wait for listener responses before timing out |
| `silent` | `boolean` | `false` | If true, the event will not store responses or errors |

### Event Class

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `topic` | `string` | The topic of the event |
| `data` | `any` | The payload data of the event |
| `response` | `any` | The response data set by the listener |
| `err` | `Error` | The error object if an error occurred |
| `timestamp` | `number` | When the event was created |
| `id` | `string` | Unique event identifier |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `respond` | `data: any` | `Event` | Set the response data for the event |
| `error` | `error: Error` | `Event` | Set the error for the event |

## Advanced Examples

### Creating a Request-Response Pattern

```javascript
// Create an RPC-like system
async function callRemote(method, params) {
  const responseTopic = `response:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  
  // Create a promise that will resolve when we get a response
  const responsePromise = new Promise((resolve) => {
    pulse.on(responseTopic, (event) => {
      resolve(event.data);
    }, { once: true });
  });
  
  // Add the response topic to the request
  await pulse.emit(`rpc:${method}`, {
    params,
    responseTopic
  });
  
  // Wait for the response
  return responsePromise;
}

// Handle RPC requests
pulse.on('rpc:**', (event) => {
  const method = event.topic.split(':')[1];
  const { params, responseTopic } = event.data;
  
  // Process the request
  const result = processMethod(method, params);
  
  // Send the response back
  pulse.emit(responseTopic, result);
});

// Usage
const result = await callRemote('getUserProfile', { id: 123 });
```

### Creating a State Management System

```javascript
class Store {
  constructor(pulse, initialState = {}) {
    this.pulse = pulse;
    this.state = initialState;
    
    // Listen for state change requests
    this.pulse.on('store:set:**', (event) => {
      const path = event.topic.replace('store:set:', '').split(':');
      this.setState(path, event.data);
    });
  }
  
  setState(path, value) {
    let current = this.state;
    const pathArr = Array.isArray(path) ? path : [path];
    
    // Navigate to the nested property
    for (let i = 0; i < pathArr.length - 1; i++) {
      if (!current[pathArr[i]]) {
        current[pathArr[i]] = {};
      }
      current = current[pathArr[i]];
    }
    
    // Set the value
    const lastKey = pathArr[pathArr.length - 1];
    const oldValue = current[lastKey];
    current[lastKey] = value;
    
    // Emit state change event
    this.pulse.emit(`store:changed:${path.join(':')}`, {
      oldValue,
      newValue: value,
      path
    });
  }
  
  getState(path) {
    if (!path) return this.state;
    
    let current = this.state;
    const pathArr = Array.isArray(path) ? path : path.split(':');
    
    for (const key of pathArr) {
      if (current[key] === undefined) return undefined;
      current = current[key];
    }
    
    return current;
  }
}

// Usage
const store = new Store(pulse, { 
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark' } 
});

// Listen for changes
pulse.on('store:changed:user:name', (event) => {
  console.log(`User's name changed from ${event.data.oldValue} to ${event.data.newValue}`);
});

// Update state
pulse.emit('store:set:user:name', 'Jane');
```

## Performance Considerations

- **Wildcards**: Using many `**` wildcards can impact performance as they require more complex pattern matching
- **Listener Count**: High numbers of listeners on frequently emitted topics can affect performance
- **Middleware Complexity**: Complex middleware chains can add overhead to event processing

## Browser Support

Pulse works in all modern browsers and Node.js environments. It uses ES6 features like Promises, Maps, and arrow functions.

## License

MIT © Killian Di Vincenzo

---

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request