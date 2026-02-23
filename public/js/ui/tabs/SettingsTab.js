import { ProjectSettings } from "../../models/ProjectSettings.js";
/**
 * SettingsTab.js
 * UI component for configuring project settings.
 */
import { showError, showInfo } from "../notifications.js";
import { renderBasicInfoSection } from "./settings/basicInfoSection.js";
import {
  renderDialogueSection,
  DIALOGUE_STYLE_INPUT_IDS,
  updateDialoguePreview,
} from "./settings/dialogueSection.js";
import {
  renderFeaturesSection,
  renderGameOptionsSection,
} from "./settings/gameOptionsSection.js";
import {
  renderPauseMenuSection,
  PAUSE_STYLE_INPUT_IDS,
  updatePausePreview,
} from "./settings/pauseMenuSection.js";
import {
  renderStartScreenSection,
  START_SCREEN_INPUT_IDS,
  updateStartScreenPreview,
} from "./settings/startScreenSection.js";
import {
  renderMenuStyleSection,
  MENU_STYLE_INPUT_IDS,
  updateMenuSavePreview,
} from "./settings/menusStyleSection.js";
import { applySettingsFromForm } from "./settings/saveSettings.js";

export class SettingsTab {
  /**
   * @param {Object} projectStore
   * @param {Object} apiClient
   */
  constructor(projectStore, apiClient = null) {
    this.projectStore = projectStore;
    this.apiClient = apiClient;
    this.settings = null;
    this.autoSaveTimeout = null;
    this.statusTimeout = null;
    this.container = null;
  }

  /**
   * Renders the settings form.
   * @returns {HTMLElement}
   */
  render() {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.justifyContent = "center";

    if (!this.projectStore.project) {
      container.innerHTML = "<p>Carga o crea un proyecto primero.</p>";
      return container;
    }

    if (!this.projectStore.project.settings) {
      this.projectStore.project.settings = new ProjectSettings();
    }

    this.settings = this.projectStore.project.settings;
    this.container = container;

    container.innerHTML = `
      <div class="settings-container">
        <h2>Configuración del Proyecto</h2>
        <div class="settings-autosave">
          <span class="muted">Los cambios se guardan automáticamente.</span>
          <span class="settings-save-status" id="settings-save-status"></span>
        </div>
        ${renderBasicInfoSection(
      this.settings,
      this.renderImageOptions(this.settings.iconId)
    )}
        ${renderFeaturesSection(this.settings)}
        ${renderGameOptionsSection(this.settings)}
        ${renderStartScreenSection(
      this.settings,
      this.renderImageOptions(this.settings.startScreenImageId)
    )}
        ${renderMenuStyleSection(this.settings)}
        ${renderDialogueSection(this.settings)}
        ${renderPauseMenuSection(this.settings)}
      </div>
    `;

    this.attachEventListeners(container);
    this.updatePreview(container);

    return container;
  }

  /**
   * Generates optional HTML for images.
   * @param {string|null} selectedId
   * @returns {string}
   */
  renderImageOptions(selectedId = null) {
    if (!this.projectStore.project.images) return "";

    return this.projectStore.project.images
      .map(
        (img) =>
          `<option value="${img.id}" ${selectedId === img.id ? "selected" : ""
          } data-filename="${img.fileName || ""}">${img.name}</option>`
      )
      .join("");
  }

  /**
   * Gets image URL.
   * @param {string} imageId
   * @returns {string|null}
   */
  getImageUrl(imageId) {
    if (!imageId || !this.projectStore.project) return null;
    const asset = (this.projectStore.project.images || []).find(
      (img) => img.id === imageId
    );
    if (!asset) return null;
    const projectId = this.projectStore.project.id;
    const origin = this.apiClient
      ? new URL(this.apiClient.baseUrl).origin
      : window.location.origin;
    return `${origin}/projects/${encodeURIComponent(
      projectId
    )}/images/${encodeURIComponent(asset.fileName)}`;
  }

  /**
   * Gets URL of first image (fallback).
   * @returns {string|null}
   */
  getFirstImageUrl() {
    if (!this.projectStore.project) return null;
    const asset = (this.projectStore.project.images || [])[0];
    if (!asset) return null;
    return this.getImageUrl(asset.id);
  }

  /**
   * Attaches UI event listeners.
   * @param {HTMLElement} container
   */
  attachEventListeners(container) {
    const toggles = container.querySelectorAll(".collapse-toggle");
    toggles.forEach((btn) => {
      const target = btn.dataset.target;
      const section = container.querySelector(
        `.settings-section[data-section="${target}"]`
      );
      if (!section) return;
      section.classList.add("collapsed");
      btn.textContent = "Mostrar";
      btn.addEventListener("click", () => {
        const collapsed = section.classList.toggle("collapsed");
        btn.textContent = collapsed ? "Mostrar" : "Ocultar";
      });
    });

    this.attachAutoSaveListeners(container);
  }

  /**
   * Updates preview components.
   * @param {HTMLElement} container
   */
  updatePreview(container) {
    updateDialoguePreview(container);
    updatePausePreview(container);
    updateStartScreenPreview(container, {
      resolveImageUrl: (id) => this.getImageUrl(id),
      fallbackImageUrl: () => this.getFirstImageUrl(),
      settings: this.settings,
    });
    updateMenuSavePreview(container, this.settings);
  }

  /**
   * Attaches listeners for auto-save.
   * @param {HTMLElement} container
   */
  attachAutoSaveListeners(container) {
    const autoSaveInputs = container.querySelectorAll(
      ".settings-section-body input, .settings-section-body select, .settings-section-body textarea"
    );
    const styleInputs = new Set([
      ...DIALOGUE_STYLE_INPUT_IDS,
      ...PAUSE_STYLE_INPUT_IDS,
      ...START_SCREEN_INPUT_IDS,
      ...MENU_STYLE_INPUT_IDS,
      "window-width",
      "window-height",
    ]);

    autoSaveInputs.forEach((input) => {
      const handler = () => {
        if (styleInputs.has(input.id)) {
          this.updatePreview(container);
        }
        this.scheduleAutoSave(container);
      };
      input.addEventListener("input", handler);
      if (input.tagName === "SELECT") {
        input.addEventListener("change", handler);
      }
    });
  }

  /**
   * Schedules an auto-save operation.
   * @param {HTMLElement} container
   */
  scheduleAutoSave(container) {
    if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
    this.setStatus(container, "Guardando...");
    this.autoSaveTimeout = setTimeout(() => {
      this.saveSettings(container, { silent: true });
    }, 350);
  }

  /**
   * Updates save status text.
   * @param {HTMLElement} container
   * @param {string} text
   */
  setStatus(container, text) {
    const statusEl = container.querySelector("#settings-save-status");
    if (!statusEl) return;
    if (this.statusTimeout) clearTimeout(this.statusTimeout);
    statusEl.textContent = text || "";
    if (text) {
      this.statusTimeout = setTimeout(() => {
        const el = container.querySelector("#settings-save-status");
        if (el) el.textContent = "";
      }, 1800);
    }
  }

  /**
   * Saves settings to project store.
   * @param {HTMLElement} container
   * @param {Object} options
   */
  saveSettings(container, { silent = false } = {}) {
    if (!this.settings || !this.projectStore.project) return;
    const before = JSON.stringify(this.settings);
    applySettingsFromForm(container, this.settings);
    const after = JSON.stringify(this.settings);
    if (before === after) {
      return;
    }
    this.projectStore.project.settings = this.settings;
    this.projectStore.notify();
    this.setStatus(container, "Guardado");
    if (!silent) {
      showInfo("Configuración guardada correctamente");
    }
  }

  /**
   * Flushes any pending auto-save.
   */
  flushPendingSave() {
    if (!this.container) return;
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
    this.saveSettings(this.container, { silent: true });
  }

  /**
   * Cleans up timeouts.
   */
  destroy() {
    this.flushPendingSave();
    if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
    if (this.statusTimeout) clearTimeout(this.statusTimeout);
  }
}
