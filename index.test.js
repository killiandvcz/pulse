import { expect, describe, it, beforeEach, mock } from "bun:test";
import {Pulse, Event, Pattern, Listener, Listeners} from "./models/index.js";


describe('Pattern', () => {
    describe('matches', () => {
        it('should match exact strings', () => {
            const pattern = new Pattern('user:login');
            expect(pattern.matches('user:login')).toBe(true);
            expect(pattern.matches('user:logout')).toBe(false);
        });

        it('should match single wildcard', () => {
            const pattern = new Pattern('user:*:update');
            expect(pattern.matches('user:profile:update')).toBe(true);
            expect(pattern.matches('user:settings:update')).toBe(true);
            expect(pattern.matches('user:profile:delete')).toBe(false);
            expect(pattern.matches('user:profile:settings:update')).toBe(false);
        });

        it('should match double wildcard', () => {
            const pattern = new Pattern('user:**');
            expect(pattern.matches('user:login')).toBe(true);
            expect(pattern.matches('user:profile:update')).toBe(true);
            expect(pattern.matches('user:settings:profile:update')).toBe(true);
            expect(pattern.matches('admin:user:login')).toBe(false);
        });
    });
});

describe('Event', () => {
    it('should create event with correct properties', () => {
        const event = new Event('user:login', { userId: 123 }, 'user:*');
        expect(event.name).toBe('user:login');
        expect(event.data).toEqual({ userId: 123 });
        expect(event.source).toBe('user:*');
        expect(event.namespace).toEqual(['user', 'login']);
        expect(event.cancelled).toBe(false);
        expect(event.timestamp).toBeDefined();
    });

    it('should be cancellable', () => {
        const event = new Event('test');
        event.cancel();
        expect(event.cancelled).toBe(true);
    });
});

describe('Listener', () => {
    let listeners;

    beforeEach(() => {
        listeners = new Listeners();
    });

    it('should create listener with correct properties', () => {
        const callback = mock(() => {});
        const listener = new Listener(
            { name: 'test', callback },
            { once: true, priority: 10 },
            listeners
        );

        expect(listener.name).toBe('test');
        expect(listener.callback).toBe(callback);
        expect(listener.once).toBe(true);
        expect(listener.priority).toBe(10);
        expect(listener.id).toBeDefined();
    });

    it('should correctly match event names', () => {
        const listener = new Listener(
            { name: 'user:*:update', callback: mock(() => {}) },
            {},
            listeners
        );

        expect(listener.matches('user:profile:update')).toBe(true);
        expect(listener.matches('user:login')).toBe(false);
    });
});

describe('Listeners', () => {
    let listeners;

    beforeEach(() => {
        listeners = new Listeners();
    });

    it('should add and retrieve listeners', () => {
        const callback = mock(() => {});
        const listener = listeners.add('test', callback);
        expect(listeners.count('test')).toBe(1);
        expect(listeners.get('test').has(listener)).toBe(true);
    });

    it('should remove listeners', () => {
        const listener = listeners.add('test', mock(() => {}));
        listener.remove();
        expect(listeners.count('test')).toBe(0);
        expect(listeners.has('test')).toBe(false);
    });

    it('should get matching listeners in priority order', () => {
        const callback = mock(() => {});
        listeners.add('user:*:update', callback, { priority: 1 });
        listeners.add('user:**', callback, { priority: 2 });
        listeners.add('user:profile:update', callback, { priority: 3 });

        const matching = listeners.getMatchingListeners('user:profile:update');
        expect(matching.length).toBe(3);
        expect(matching[0].priority).toBe(3);
        expect(matching[1].priority).toBe(2);
        expect(matching[2].priority).toBe(1);
    });
});

describe('Pulse', () => {
    /**
     * @type {Pulse}
     */
    let pulse;
    let mockCallback;

    beforeEach(() => {
        pulse = new Pulse();
        mockCallback = mock(() => {});
    });

    it('should emit events to exact matches', async () => {
        pulse.on('test', mockCallback);
        await pulse.emit('test', { data: 'test' });
        expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should emit events to pattern matches', async () => {
        pulse.on('user:*:update', mockCallback);
        await pulse.emit('user:profile:update');
        await pulse.emit('user:settings:update');
        expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should handle once listeners', async () => {
        pulse.once('test', mockCallback);
        await pulse.emit('test');
        await pulse.emit('test');
        expect(mockCallback).toHaveBeenCalledTimes(1);
    });
});

describe('Error cases', () => {
    /**
     * @type {Pulse}
     */
    let pulse;

    beforeEach(() => {
        pulse = new Pulse();
    });

    it('should handle async errors in listeners', async () => {
        const errorCallback = mock(() => {
            throw new Error('test error');
        });
        const normalCallback = mock(() => {});

        pulse.on('test', errorCallback);
        pulse.on('test', normalCallback);

        await expect(() => pulse.emit('test')).toThrow('test error');
        expect(normalCallback).not.toHaveBeenCalled();
    });
});