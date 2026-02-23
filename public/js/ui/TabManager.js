/**
 * Manages UI tabs and switching between them.
 */
/**
 * TabManager.js
 * Manages the switching and lifecycle of main application tabs.
 */
export class TabManager {
  /**
   * @param {HTMLElement} rootElement - Container for tab content.
   * @param {Object} tabsMap - Map of tab IDs to tab instances.
   */
  constructor(rootElement, tabsMap) {
    this.rootElement = rootElement;
    this.tabsMap = tabsMap;
    this.currentTabId = null;
  }

  /**
   * Switches to the specified tab.
   * @param {string} tabId
   */
  show(tabId) {
    if (this.currentTabId && this.tabsMap[this.currentTabId]) {
      const previousTab = this.tabsMap[this.currentTabId];
      if (typeof previousTab.destroy === "function") {
        previousTab.destroy();
      }
    }
    this.currentTabId = tabId;
    this.rootElement.innerHTML = "";
    const tab = this.tabsMap[tabId];
    if (!tab) return;
    const el = tab.render();
    this.rootElement.appendChild(el);
    if (typeof tab.refresh === "function") {
      tab.refresh();
    }
  }

  /**
   * Refreshes all tabs (if they implement refresh).
   */
  refreshAll() {
    Object.values(this.tabsMap).forEach((t) => {
      if (typeof t.refresh === "function") {
        t.refresh();
      }
    });
    if (this.currentTabId) {
      this.show(this.currentTabId);
    }
  }

  /**
   * Destroys all tabs and clears content.
   */
  destroy() {
    Object.values(this.tabsMap).forEach((t) => {
      if (typeof t.destroy === "function") {
        t.destroy();
      }
    });
    this.rootElement.innerHTML = "";
    this.currentTabId = null;
  }
}
