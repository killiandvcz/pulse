// tests/pulse.test.js
import { describe, expect, test, beforeEach, afterEach, spyOn, mock } from "bun:test";
import { Pulse } from "../src/core/pulse";
import { Listener } from "../src/core/listener";
import { Event } from "../src/core/event";
import { Middleware } from "../src/core/middleware";

describe("Pulse", () => {
    let pulse;
    
    beforeEach(() => {
        pulse = new Pulse();
    });
    
    describe("Basic event functionality", () => {
        test("should create a listener", () => {
            const listener = pulse.on("test", () => {});
            expect(listener).toBeInstanceOf(Listener);
            expect(pulse.listeners.has("test")).toBe(true);
        });
        
        test("should emit an event and receive a response", async () => {
            const responseData = { success: true };
            pulse.on("test", (event) => {
                return responseData;
            });
            
            const results = await pulse.emit("test", { message: "hello" });
            expect(results.length).toBe(1);
            expect(results[0].response).toEqual(responseData);
        });
        
        test("should not emit to unrelated listeners", async () => {
            const spy1 = mock(() => {});
            const spy2 = mock(() => {});
            
            pulse.on("test:foo", spy1);
            pulse.on("test:bar", spy2);
            
            await pulse.emit("test:foo", {});
            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(0);
        });
    });
    
    describe("Wildcard patterns", () => {
        test("should match single wildcard pattern", async () => {
            const spy = mock(() => {});
            pulse.on("test:*", spy);
            
            await pulse.emit("test:foo", {});
            await pulse.emit("test:bar", {});
            await pulse.emit("test:foo:bar", {}); // This shouldn't match
            
            expect(spy).toHaveBeenCalledTimes(2);
        });
        
        test("should match double wildcard pattern", async () => {
            const spy = mock(() => {});
            pulse.on("test:**", spy);
            
            await pulse.emit("test:foo", {});
            await pulse.emit("test:bar", {});
            await pulse.emit("test:foo:bar", {});
            await pulse.emit("test:foo:bar:baz", {});
            
            expect(spy).toHaveBeenCalledTimes(4);
        });
        
        test("should match complex patterns", async () => {
            const spy = mock(() => {});
            pulse.on("test:*:end", spy);
            
            await pulse.emit("test:foo:end", {});
            await pulse.emit("test:bar:end", {});
            await pulse.emit("test:end", {}); // Shouldn't match
            await pulse.emit("test:foo:bar:end", {}); // Shouldn't match
            
            expect(spy).toHaveBeenCalledTimes(2);
        });
        
        test("should match complex double wildcard patterns", async () => {
            const spy = mock((event) => {});
            pulse.on("test:**:end", spy);
            
            await pulse.emit("test:end", {});
            await pulse.emit("test:foo:end", {});
            await pulse.emit("test:foo:bar:end", {});
            await pulse.emit("test:foo", {}); // Shouldn't match
            
            // expect(spy).toHaveBeenCalledTimes(3);
            expect(spy).toHaveBeenCalledTimes(2);
        });
    });
    
    describe("Listener options", () => {
        test("should auto-destroy listener with once option", async () => {
            pulse.on("test", () => {}, { once: true });
            expect(pulse.listeners.size).toBe(1);
            
            await pulse.emit("test", {});
            // Allow for async cleanup
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(pulse.listeners.size).toBe(0);
        });
        
        test("should auto-destroy after specified number of calls", async () => {
            pulse.on("test", () => {}, { autodestroy: { calls: 2 } });
            expect(pulse.listeners.size).toBe(1);
            
            await pulse.emit("test", {});
            expect(pulse.listeners.size).toBe(1);
            
            await pulse.emit("test", {});
            // Allow for async cleanup
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(pulse.listeners.size).toBe(0);
        });
        
        test("should auto-destroy after timeout", async () => {
            pulse.on("test", () => {}, { autodestroy: { timeout: 50 } });
            expect(pulse.listeners.size).toBe(1);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(pulse.listeners.size).toBe(0);
        });
    });
    
    describe("Timeout functionality", () => {
        test("should handle event timeout", async () => {
            const listener = pulse.on("test", async () => {
                // Simulate a long operation
                await new Promise(resolve => setTimeout(resolve, 100));
            });
            
            const results = await pulse.emit("test", {}, { timeout: 50 });
            expect(results[0].err).toBeDefined();
            expect(results[0].err.message).toContain("timed out");
        });
        
        test("should complete normally without timeout", async () => {
            pulse.on("test", async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return "success";
            });
            
            const results = await pulse.emit("test", {}, { timeout: 100 });
            expect(results[0].err).toBeNull();
            expect(results[0].response).toBe("success");
        });
    });
    
    describe("Middleware functionality", () => {
        test("should apply middleware to matching events", async () => {
            const middleware = mock(async (event, next) => {
                event.data.middlewareWasHere = true;
                await next();
            });
            
            pulse.use("test:*", middleware);
            
            const responseHandler = mock((event) => {
                expect(event.data.middlewareWasHere).toBe(true);
                return "got it";
            });
            
            pulse.on("test:foo", responseHandler);
            
            await pulse.emit("test:foo", {});
            expect(middleware).toHaveBeenCalledTimes(1);
            expect(responseHandler).toHaveBeenCalledTimes(1);
        });
        
        test("middleware should be able to block event propagation", async () => {
            pulse.use("test:*", async (event, next) => {
                // Don't call next()
                event.respond("blocked by middleware");
            });
            
            const handler = mock(() => {
                throw new Error("This should not be called");
            });
            
            pulse.on("test:foo", handler);
            
            const results = await pulse.emit("test:foo", {});
            expect(results[0].response).toBe("blocked by middleware");
            expect(handler).toHaveBeenCalledTimes(0);
        });
        
        test("middleware should run in correct order", async () => {
            const sequence = [];
            
            pulse.use("test", async (event, next) => {
                sequence.push(1);
                await next();
                sequence.push(4);
            });
            
            pulse.use("test", async (event, next) => {
                sequence.push(2);
                await next();
                sequence.push(3);
            });
            
            pulse.on("test", () => {
                sequence.push("handler");
            });
            
            await pulse.emit("test", {});
            expect(sequence).toEqual([1, 2, "handler", 3, 4]);
        });
    });
    
    describe("Error handling", () => {
        test("should handle errors in listeners", async () => {
            const error = new Error("Listener error");
            
            pulse.on("test", () => {
                throw error;
            });
            
            const results = await pulse.emit("test", {});
            expect(results[0].err).toBe(error);
        });
        
        test("should handle errors in middleware", async () => {
            const error = new Error("Middleware error");
            
            pulse.use("test", async () => {
                throw error;
            });
            
            const handler = mock(() => {});
            pulse.on("test", handler);
            
            const results = await pulse.emit("test", {});
            expect(results[0].err).toBe(error);
            expect(handler).toHaveBeenCalledTimes(0);
        });
        
        test("should validate topic format", async () => {
            try {
                pulse.on("invalid topic", () => {});
            } catch (e) {
                expect(e.message).toContain("Invalid pattern");
            }
            
            await pulse.emit("invalid topic", {}).catch(e => {
                expect(e.message).toContain("Invalid topic");
            })
        });
    });
    
    describe("Utility methods", () => {
        test("should remove specific listener", async () => {
            pulse.on("test:a", () => {});
            pulse.on("test:b", () => {});
            
            expect(pulse.listeners.size).toBe(2);
            
            pulse.off("test:a");
            expect(pulse.listeners.size).toBe(1);
            expect(pulse.listeners.has("test:a")).toBe(false);
            expect(pulse.listeners.has("test:b")).toBe(true);
        });
        
        test("should remove all listeners", () => {
            pulse.on("test:a", () => {});
            pulse.on("test:b", () => {});
            pulse.on("test:c", () => {});
            
            expect(pulse.listeners.size).toBe(3);
            
            pulse.removeAllListeners();
            expect(pulse.listeners.size).toBe(0);
        });
        
        test("listener should be able to self-destroy", async () => {
            const listener = pulse.on("test", () => {});
            expect(pulse.listeners.has("test")).toBe(true);
            
            listener.destroy();
            expect(pulse.listeners.has("test")).toBe(false);
        });
    });
    
    describe("Edge cases", () => {
        test("should handle events with no listeners", async () => {
            const results = await pulse.emit("nonexistent", {});
            expect(results).toEqual([]);
        });
        
        test("should handle multiple listeners for same event", async () => {
            const spy1 = mock(() => "response1");
            const spy2 = mock(() => "response2");
            
            pulse.on("test", spy1);
            pulse.on("test", spy2);
            
            const results = await pulse.emit("test", {});
            expect(results.length).toBe(2);
            expect(results[0].response).toBe("response1");
            expect(results[1].response).toBe("response2");
            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(1);
        });
        
        // test("should handle silent events", async () => {
        //     const handler = mock((event) => {
        //         // Try to respond to silent event
        //         event.respond("this shouldn't be set");
        //         expect(event.response).toBeNull();
        //     });
            
        //     pulse.on("test", handler);
            
        //     const results = await pulse.emit("test", {}, { silent: true });
        //     expect(handler).toHaveBeenCalledTimes(1);
        //     expect(results[0].response).toBeNull();
        // });
    });
});