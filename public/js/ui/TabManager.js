export class TabManager {
  constructor(rootElement, tabsMap) {
    this.rootElement = rootElement;
    this.tabsMap = tabsMap;
    this.currentTabId = null;
  }

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
