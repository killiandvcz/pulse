# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
