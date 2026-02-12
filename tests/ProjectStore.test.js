import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { ProjectStore } from "../public/js/state/ProjectStore.js";

// Mock CommandHistory since we don't tested it here and it has dependencies
jest.mock("../public/js/commands/CommandHistory.js", () => {
    return {
        CommandHistory: class {
            constructor() { this.clear(); }
            clear() { }
            execute() { return true; }
            undo() { return true; }
            redo() { return true; }
            canUndo() { return false; }
            canRedo() { return false; }
        }
    };
});

describe("ProjectStore", () => {
    let store;

    beforeEach(() => {
        store = new ProjectStore();
    });

    test("subscribe should work", () => {
        const listener = jest.fn();
        const unsubscribe = store.subscribe(listener);

        store.notify();
        expect(listener).toHaveBeenCalled();

        unsubscribe();
        listener.mockClear();
        store.notify();
        expect(listener).not.toHaveBeenCalled();
    });

    test("subscribe with filter should work", () => {
        const listenerGlobal = jest.fn();
        const listenerNodes = jest.fn();
        const listenerOther = jest.fn();

        store.subscribe(listenerGlobal);
        store.subscribe(listenerNodes, "nodes");
        store.subscribe(listenerOther, "other");

        store.notify("nodes");

        // Global listeners receive updates
        expect(listenerGlobal).toHaveBeenCalledWith("nodes");
        // Filtered listeners matching receive updates
        expect(listenerNodes).toHaveBeenCalledWith("nodes");
        // Non-matching listeners do not
        expect(listenerOther).not.toHaveBeenCalled();
    });

    test("notify without args should trigger all", () => {
        const listenerNodes = jest.fn();
        store.subscribe(listenerNodes, "nodes");

        store.notify();
        // If notify called without args (global update), all listeners should trigger?
        // Implementation: if (!entry.filter || !changeType || entry.filter === changeType)
        // changeType is null. entry.filter is "nodes".
        // !entry.filter is false. !changeType is true. Match!
        expect(listenerNodes).toHaveBeenCalledWith(null);
    });
});
