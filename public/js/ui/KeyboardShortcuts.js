export class KeyboardShortcuts {
  constructor(element) {
    this.element = element;
    this.shortcuts = new Map();
    this.enabled = false;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  register(key, callback, description = "") {
    const normalized = this.normalizeKey(key);
    this.shortcuts.set(normalized, { callback, description });
  }

  unregister(key) {
    const normalized = this.normalizeKey(key);
    this.shortcuts.delete(normalized);
  }

  normalizeKey(key) {
    return key.toLowerCase().trim();
  }

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

  enable() {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    this.element.addEventListener("keydown", this.handleKeyDown);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this.element.removeEventListener("keydown", this.handleKeyDown);
  }

  destroy() {
    this.disable();
    this.shortcuts.clear();
  }

  list() {
    return Array.from(this.shortcuts.entries()).map(
      ([key, { description }]) => ({
        key,
        description,
      })
    );
  }
}
