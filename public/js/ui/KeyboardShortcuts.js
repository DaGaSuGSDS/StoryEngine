/**
 * Manages keyboard shortcuts for the application.
 */
/**
 * KeyboardShortcuts.js
 * Manages global keyboard shortcuts for the application.
 */
export class KeyboardShortcuts {
  /**
   * @param {HTMLElement} element - Target element to listen on (usually window or document.body).
   */
  constructor(element) {
    this.element = element;
    this.shortcuts = new Map();
    this.enabled = false;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Registers a new shortcut.
   * @param {string} key - Key combination (e.g., "ctrl+s").
   * @param {Function} callback - Function to call.
   * @param {string} [description] - Description for help UI.
   */
  register(key, callback, description = "") {
    const normalized = this.normalizeKey(key);
    this.shortcuts.set(normalized, { callback, description });
  }

  /**
   * Unregisters a shortcut.
   * @param {string} key - Key combination.
   */
  unregister(key) {
    const normalized = this.normalizeKey(key);
    this.shortcuts.delete(normalized);
  }

  /**
   * Normalizes key string.
   * @param {string} key
   * @returns {string}
   */
  normalizeKey(key) {
    return key.toLowerCase().trim();
  }

  /**
   * Converts a keyboard event to a key string.
   * @param {KeyboardEvent} e
   * @returns {string}
   */
  eventToKey(e) {
    const parts = [];

    if (e.ctrlKey || e.metaKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");

    const specialKeys = {
      Delete: "delete",
      Backspace: "backspace",
      Escape: "escape",
      Enter: "enter",
      Tab: "tab",
      " ": "space",
    };

    if (specialKeys[e.key]) {
      parts.push(specialKeys[e.key]);
    } else {
      parts.push(e.key.toLowerCase());
    }

    return parts.join("+");
  }

  /**
   * Handles keydown events.
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    if (!this.enabled) return;

    const target = e.target;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    const key = this.eventToKey(e);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      e.preventDefault();
      e.stopPropagation();
      shortcut.callback(e);
    }
  }

  /**
   * Enables shortcut listening.
   */
  enable() {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    this.element.addEventListener("keydown", this.handleKeyDown);
  }

  /**
   * Disables shortcut listening.
   */
  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this.element.removeEventListener("keydown", this.handleKeyDown);
  }

  /**
   * Cleans up listeners and clears shortcuts.
   */
  destroy() {
    this.disable();
    this.shortcuts.clear();
  }

  /**
   * Lists all registered shortcuts.
   * @returns {Array<{key: string, description: string}>}
   */
  list() {
    return Array.from(this.shortcuts.entries()).map(
      ([key, { description }]) => ({
        key,
        description,
      })
    );
  }
}
