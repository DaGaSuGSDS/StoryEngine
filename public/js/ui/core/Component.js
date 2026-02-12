/**
 * Base component class for UI elements.
 * Manages lifecycle (mount/destroy), DOM creation, and event cleanup.
 */
export class Component {
    constructor(props = {}) {
        this.props = props;
        this.element = null;
        this.children = [];
        this.eventListeners = [];
    }

    /**
     * Generates the DOM element(s) for this component.
     * Must be implemented by subclasses.
     * @returns {HTMLElement}
     */
    render() {
        throw new Error("Component.render() must be implemented");
    }

    /**
     * Helper to create DOM elements with classes and attributes.
     * @param {string} tag
     * @param {string|string[]} classes
     * @param {object} attributes
     * @param {string} textContent
     * @returns {HTMLElement}
     */
    createElement(tag, classes = [], attributes = {}, textContent = "") {
        const el = document.createElement(tag);

        if (typeof classes === "string") {
            if (classes) el.className = classes;
        } else if (Array.isArray(classes) && classes.length) {
            el.classList.add(...classes);
        }

        if (attributes) {
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === "style" && typeof value === "object") {
                    Object.assign(el.style, value);
                } else if (key.startsWith("on") && typeof value === "function") {
                    // Event handler direct attachment (e.g. onclick)
                    // For managed listeners, use addManagedListener instead
                    el[key] = value;
                } else {
                    el.setAttribute(key, value);
                }
            });
        }

        if (textContent) {
            el.textContent = textContent;
        }

        return el;
    }

    /**
     * Mounts the component to a parent element.
     * @param {HTMLElement} parent
     * @returns {HTMLElement} The created element
     */
    mount(parent) {
        this.element = this.render();
        if (parent) {
            parent.appendChild(this.element);
        }
        this.onMount();
        return this.element;
    }

    /** Lifecycle hook called after mounting */
    onMount() { }

    /** Lifecycle hook called before destruction */
    onDestroy() { }

    /**
     * Removes the component from DOM and cleans up listeners.
     */
    destroy() {
        this.onDestroy();

        this.eventListeners.forEach(({ target, type, listener }) => {
            target.removeEventListener(type, listener);
        });
        this.eventListeners = [];

        this.children.forEach(child => {
            if (typeof child.destroy === 'function') {
                child.destroy();
            }
        });
        this.children = [];

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Adds an event listener that will be automatically removed on destroy.
     * @param {EventTarget} target
     * @param {string} type
     * @param {function} listener
     */
    addManagedListener(target, type, listener) {
        target.addEventListener(type, listener);
        this.eventListeners.push({ target, type, listener });
    }
}
