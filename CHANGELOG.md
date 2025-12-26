# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.3] - 2025-12-26

### 🎯 Pattern Matching Improvements

#### Changed
- **`**` pattern now matches 0 or more sections** (previously inconsistent)
  - `user:**:success` now matches `user:success` (0 sections), `user:login:success` (1 section), etc.
  - `**:login` now matches `login` (0 sections before), `user:login`, `app:user:login`
  - `user:**` now matches `user` (0 sections after), `user:login`, `user:login:admin`

#### Added
- **`++` pattern for 1 or more sections** (new)
  - `++:login` matches `user:login`, `app:user:login` but NOT `login`
  - `user:++` matches `user:login`, `user:login:admin` but NOT `user`
  - `user:++:success` matches `user:login:success`, `user:login:admin:success` but NOT `user:success`

### ⚡ Performance & Reliability

#### Changed
- **Reduced default timeout from 30s to 5s** for better responsiveness
  - Custom timeouts can still be set via options: `pulse.emit('topic', data, { timeout: 10000 })`

#### Added
- **Pattern cache management** to prevent memory leaks
  - Automatic cache clearing when reaching 1000 patterns
  - New `pulse.clearPatternCache()` method for manual cache management
  - Useful for long-running applications with dynamic pattern usage

### 🔧 Event Context Management

#### Changed
- **Refactored PulseEvent to use composition instead of Map inheritance**
  - Replaces `extends Map` with private `#context` field
  - Avoids method collisions and unexpected Map behaviors
  - More predictable and controlled API

#### Added
- **New context methods on PulseEvent**:
  - `event.set(key, value)` - Set context value (chainable)
  - `event.get(key)` - Get context value
  - `event.has(key)` - Check if key exists
  - `event.delete(key)` - Remove context entry
  - `event.clearContext()` - Clear all context data (chainable)

### 🛡️ Error Handling

#### Added
- **Unified error handling between middlewares and listeners**
  - Middleware errors are now caught and collected in `event.errors`
  - Event processing continues even if a middleware throws an error
  - Provides consistent error behavior across the entire event chain

### 🐛 Bug Fixes

#### Fixed
- **Module import extensions**: Added missing `.js` extensions to internal imports
  - Fixed `import { Listener } from './listener'` → `import { Listener } from './listener.js'`
  - Fixed `import { Middleware } from './middleware'` → `import { Middleware } from './middleware.js'`
  - Ensures compatibility with ES modules

## [2.0.0] - 2025-12-26

### 🚀 Major Release - API Simplification

This is a major release with **breaking changes** that significantly simplifies the API and improves developer experience.

### ⚠️ Breaking Changes

- **Simplified callback signature**: Listeners and middleware now receive a single object parameter `{ event, pulse, listener }` instead of multiple parameters
  ```javascript
  // v1.x (old)
  pulse.on('topic', (event, pulse, listener) => { /* ... */ });

  // v2.0 (new)
  pulse.on('topic', ({ event, pulse, listener }) => { /* ... */ });
  ```

- **Automatic response handling**: Listeners can now `return` a value to automatically add it to responses
  ```javascript
  // v2.0 - both methods work
  pulse.on('greeting', ({ event }) => {
    return `Hello, ${event.data.name}!`;  // Auto-added to responses
  });

  // Or explicitly:
  pulse.on('greeting', ({ event }) => {
    event.respond(`Hello, ${event.data.name}!`);
  });
  ```

- **Removed Result class**: Events now directly contain `responses` and `errors` arrays instead of returning a Result object
  ```javascript
  // v1.x (old)
  const result = await pulse.emit('topic', data);
  result.responses[0]

  // v2.0 (new)
  const event = await pulse.emit('topic', data);
  event.responses[0]
  ```

### ✨ New Features

- **Event context management**: New methods on Event class for managing context data
  - `event.set(key, value)` - Set context value
  - `event.get(key)` - Get context value
  - `event.has(key)` - Check if context key exists
  - `event.delete(key)` - Delete context value
  - `event.clear()` - Clear all context

- **Improved error handling**: Errors thrown in listeners are now automatically caught and added to `event.errors`

- **Enhanced middleware**: Middleware can now easily modify event data and context before passing to listeners

### 🔧 Improvements

- **Better TypeScript support**: Improved type definitions with clearer JSDoc annotations
- **More intuitive API**: Destructuring parameter makes code cleaner and more readable
- **Comprehensive documentation**: Completely rewritten README with extensive examples
- **Better test coverage**: Enhanced test suite covering all major use cases

### 📚 Documentation

- Complete rewrite of README with detailed examples
- Added advanced usage patterns (RPC, state management)
- Improved API reference documentation
- Added migration guide for v1.x users (see README)

### 🐛 Bug Fixes

- Fixed pattern matching edge cases with wildcards
- Improved timeout handling for async listeners
- Better cleanup of auto-destroyed listeners

---

## [1.3.0] - 2024

### Added
- Context management to Event class
- Enhanced TypeScript configuration
- Improved event handling

## [1.2.0] - 2024

### Added
- Improved pattern handling in Pulse class
- Enhanced TypeScript configuration

### Changed
- Refactored package.json for consistency

## [1.0.0] - 2024

### Added
- Initial release
- Basic event system with Pulse, Listener, and Middleware classes
- Pattern matching with wildcards
- Middleware support
- Timeout handling
- Promise-based API

[2.0.0]: https://github.com/killiandvcz/pulse/compare/1.3.0...2.0.0
[1.3.0]: https://github.com/killiandvcz/pulse/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/killiandvcz/pulse/compare/1.0.0...1.2.0
[1.0.0]: https://github.com/killiandvcz/pulse/releases/tag/1.0.0
