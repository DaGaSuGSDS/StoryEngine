import { PANEL_WIDTHS } from "./constants.js";

/**
 * ScenePanel.js
 * Component for managing scene-level settings (start node, etc.).
 */
export class ScenePanel {
  /**
   * @param {Object} projectStore
   * @param {Function} onSceneSelect
   */
  constructor(projectStore, onSceneSelect) {
    this.projectStore = projectStore;
    this.onSceneSelect = onSceneSelect;
    this.root = null;
  }

  /**
   * Renders the scene panel.
   * @returns {HTMLElement}
   */
  render() {
    this.root = document.createElement("div");
    this.root.className = "panel";
    this.root.style.width = PANEL_WIDTHS.LEFT;
    this.root.innerHTML = `
      <div class="panel-title">Escenas</div>
      <div class="panel-section">
        <ul class="list" id="scene-list"></ul>
      </div>
      <div class="panel-section row">
        <button id="scene-add" class="btn small">Añadir</button>
        <button id="scene-remove" class="btn small">Eliminar</button>
      </div>
    `;

    this.attachHandlers();
    this.renderSceneList();
    return this.root;
  }

  /**
   * Attaches event handlers to buttons.
   */
  attachHandlers() {
    const sceneAddBtn = this.root.querySelector("#scene-add");
    const sceneRemoveBtn = this.root.querySelector("#scene-remove");

    sceneAddBtn.addEventListener("click", () => {
      this.projectStore.addScene();
    });

    sceneRemoveBtn.addEventListener("click", () => {
      if (!this.projectStore.currentScene) return;
      if (
        confirm(`¿Eliminar escena "${this.projectStore.currentScene.name}"?`)
      ) {
        this.projectStore.removeScene(this.projectStore.currentScene.id);
        if (this.onSceneSelect) {
          this.onSceneSelect(null);
        }
      }
    });
  }

  /**
   * Renders the list of scenes.
   */
  renderSceneList() {
    const ul = this.root.querySelector("#scene-list");
    if (!ul) return;
    ul.innerHTML = "";
    const scenes = this.projectStore.scenes;
    scenes.forEach((scene) => {
      const li = document.createElement("li");
      li.className = "list-item";
      if (scene.id === this.projectStore.currentSceneId) {
        li.classList.add("selected");
      }
      li.textContent = scene.name;
      li.addEventListener("click", () => {
        this.projectStore.setCurrentScene(scene.id);
        if (this.onSceneSelect) {
          this.onSceneSelect(null);
        }
      });
      ul.appendChild(li);
    });
  }

  /**
   * Refreshes the panel.
   */
  refresh() {
    this.renderSceneList();
  }
}
