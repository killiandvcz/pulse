/**
 * Represents a pattern matcher that supports wildcards for event name matching.
 * @class Pattern
 *
 */
export class Pattern {
    /**
     * Creates a new Pattern instance.
     * @param {string} pattern - The pattern string to match against.
     *                          Supports wildcards:
     *                          - '*' matches any characters except colon
     *                          - '**' matches any characters including colon
     * @example
     * const pattern = new Pattern('user:*');    // Matches 'user:create', 'user:delete', etc.
     * const pattern = new Pattern('**');        // Matches any event name
     */
    constructor(pattern) {
        this.pattern = pattern;
        this.regex = this.createRegex(pattern);
    }

    /**
     * Creates a regular expression from the given pattern string.
     * @private
     * @param {string} pattern - The pattern to convert to regex
     * @returns {RegExp} The compiled regular expression
     */
    createRegex(pattern) {
        // Support des wildcards * et **
        const escaped = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace('\\*\\*', '.*')
            .replace('\\*', '[^:]*');
        return new RegExp(`^${escaped}$`);
    }

    /**
     * Tests if an event name matches the pattern.
     * @param {string} eventName - The event name to test
     * @returns {boolean} True if the event name matches the pattern
     * @example
     * const pattern = new Pattern('user:*');
     * pattern.matches('user:create');  // Returns true
     * pattern.matches('post:create');  // Returns false
     */
    matches(eventName) {
        return this.regex.test(eventName);
    }

    /**
     * Returns the original pattern string.
     * @returns {string} The pattern string used to create this Pattern instance
     */
    toString() {
        return this.pattern;
    }
}