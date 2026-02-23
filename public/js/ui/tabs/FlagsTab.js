/**
 * FlagsTab.js
 * UI component for managing boolean flags (game variables).
 */
import { Flag } from "../../models/Flag.js";
export class FlagsTab {
  /**
   * @param {Object} projectStore
   */
  constructor(projectStore) {
    this.projectStore = projectStore;
    this.root = null;
    this.selectedFlagId = null;
    this.unsubscribe = this.projectStore.subscribe(() => this.refresh());
  }

  /**
   * Renders the tab.
   * @returns {HTMLElement}
   */
  render() {
    if (!this.unsubscribe) {
      this.unsubscribe = this.projectStore.subscribe(() => this.refresh());
    }
    this.root = document.createElement("div");
    this.root.className = "panel";
    this.root.style.width = "100%";
    this.root.style.height = "100%";

    this.root.innerHTML = `
      <div class="panel-title">Flags</div>
      <div class="panel-section">
        <table class="table" id="flags-table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th></th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="panel-section">
        <button id="flag-add" class="btn small">Añadir flag</button>
      </div>
    `;

    this.root.querySelector("#flag-add").addEventListener("click", () => {
      this.projectStore.addFlag();
    });

    this.refresh();
    return this.root;
  }

  /**
   * Refreshes the list of flags.
   */
  refresh() {
    if (!this.root) return;
    const tbody = this.root.querySelector("#flags-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const flags = this.projectStore.flags;
    flags.forEach((f, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${f.id}</td>
        <td><input data-idx="${index}" value="${f.name}" /></td>
        <td><button data-idx="${index}" class="btn small">X</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        const idx = parseInt(input.dataset.idx, 10);
        this.projectStore.flags[idx].name = input.value;
        this.projectStore.notify();
      });
    });
    tbody.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const flag = this.projectStore.flags[idx];
        if (confirm(`¿Eliminar flag "${flag.name}"?`)) {
          this.projectStore.removeFlag(flag.id);
        }
      });
    });
  }

  /**
   * Cleans up subscriptions.
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
