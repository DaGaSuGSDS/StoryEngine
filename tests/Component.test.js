import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { Component } from "../public/js/ui/core/Component.js";

class TestComponent extends Component {
    render() {
        return this.createElement("div", "test-class", { id: "test-id" }, "Hello World");
    }
}

describe("Component", () => {
    test("should render correctly", () => {
        const comp = new TestComponent();
        const el = comp.render();
        expect(el.tagName).toBe("DIV");
        expect(el.className).toBe("test-class");
        expect(el.id).toBe("test-id");
        expect(el.textContent).toBe("Hello World");
    });

    test("should mount to parent", () => {
        const parent = document.createElement("div");
        const comp = new TestComponent();
        comp.mount(parent);
        expect(parent.children.length).toBe(1);
        expect(comp.element).toBe(parent.children[0]);
    });

    test("should cleanup on destroy", () => {
        const parent = document.createElement("div");
        const comp = new TestComponent();
        comp.mount(parent);

        const handler = jest.fn();
        comp.addManagedListener(comp.element, "click", handler);

        comp.element.dispatchEvent(new Event("click"));
        expect(handler).toHaveBeenCalledTimes(1);

        comp.destroy();
        expect(comp.element).toBeNull();
        expect(parent.children.length).toBe(0);

        // Listener should be removed (we can't easily test if removeEventListener was called on DOM without spy, 
        // but we can check internal state or rely on implementation correctness for now)
        expect(comp.eventListeners.length).toBe(0);
    });
});
