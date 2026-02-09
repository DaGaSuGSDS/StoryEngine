import { PANEL_WIDTHS } from "./constants.js";
import { ORDERED_NODE_TYPES } from "../../../models/nodes/nodeTypes.js";
import { escapeHtml } from "../../../utils/sanitize.js";
import { renderNodeTypeFields } from "./nodeFieldRenderers.js";
import { renderNextSelectors } from "./nextSelectorRenderer.js";
import { convertNodeType } from "./nodeTypeConverter.js";

export class NodeInspector {
  constructor(projectStore) {
    this.projectStore = projectStore;
    this.root = null;
  }

  render() {
    this.root = document.createElement("div");
    this.root.className = "panel panel-right";
    this.root.style.width = PANEL_WIDTHS.RIGHT;

    this.root.innerHTML = `
      <div class="panel-title">Inspector</div>
      <div class="panel-section" id="inspector-content">
        <div class="muted">Selecciona una escena o un nodo.</div>
      </div>
    `;

    return this.root;
  }

  renderContent(selectedNodeId) {
    const inspector = this.root.querySelector("#inspector-content");
    if (!inspector) return;
    inspector.innerHTML = "";
    const scene = this.projectStore.currentScene;
    if (!scene) {
      inspector.innerHTML =
        '<div class="muted">Crea una escena para empezar.</div>';
      return;
    }

    if (!selectedNodeId) {
      this.renderSceneInspector(inspector, scene);
    } else {
      this.renderNodeInspector(inspector, scene, selectedNodeId);
    }
  }

  renderSceneInspector(inspector, scene) {
    const sceneDiv = document.createElement("div");
    const nameSection = document.createElement("div");
    nameSection.className = "panel-section";
    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Nombre escena";
    const nameInput = document.createElement("input");
    nameInput.id = "scene-name";
    nameInput.value = scene.name || "";
    nameSection.appendChild(nameLabel);
    nameSection.appendChild(nameInput);

    const bgSection = document.createElement("div");
    bgSection.className = "panel-section";
    const bgLabel = document.createElement("label");
    bgLabel.textContent = "Fondo de la escena";
    const bgSelect = document.createElement("select");
    bgSelect.id = "scene-background";
    bgSection.appendChild(bgLabel);
    bgSection.appendChild(bgSelect);

    const startSection = document.createElement("div");
    startSection.className = "panel-section";
    const startLabel = document.createElement("label");
    startLabel.textContent = "Nodo inicial de la escena";
    const startSelect = document.createElement("select");
    startSelect.id = "scene-start-node";
    startSection.appendChild(startLabel);
    startSection.appendChild(startSelect);

    sceneDiv.appendChild(nameSection);
    sceneDiv.appendChild(bgSection);
    sceneDiv.appendChild(startSection);
    inspector.appendChild(sceneDiv);

    nameInput.addEventListener("change", () => {
      scene.name = nameInput.value;
      this.projectStore.notify();
    });

    const bgEmptyOpt = document.createElement("option");
    bgEmptyOpt.value = "";
    bgEmptyOpt.textContent = "(ninguno)";
    bgSelect.appendChild(bgEmptyOpt);
    this.projectStore.images.forEach((img) => {
      const opt = document.createElement("option");
      opt.value = img.id;
      opt.textContent = img.name;
      bgSelect.appendChild(opt);
    });
    bgSelect.value = scene.backgroundImageId || "";
    bgSelect.addEventListener("change", () => {
      scene.backgroundImageId = bgSelect.value || null;
      this.projectStore.notify();
    });

    const startEmpty = document.createElement("option");
    startEmpty.value = "";
    startEmpty.textContent = "(primero que exista)";
    startSelect.appendChild(startEmpty);
    scene.graph.nodes.forEach((node) => {
      const opt = document.createElement("option");
      opt.value = node.id;
      opt.textContent =
        node.name || `${escapeHtml(node.id)} (${escapeHtml(node.type)})`;
      startSelect.appendChild(opt);
    });
    startSelect.value = scene.graph.startNodeId || "";
    startSelect.addEventListener("change", () => {
      const val = startSelect.value;
      scene.graph.startNodeId = val || null;
      this.projectStore.notify();
    });
  }

  renderNodeInspector(inspector, scene, selectedNodeId) {
    const node = scene.graph.getNode(selectedNodeId);
    if (!node) return;

    const root = document.createElement("div");

    const nameSection = document.createElement("div");
    nameSection.className = "panel-section";
    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Nombre nodo";
    const nameInput = document.createElement("input");
    nameInput.id = "node-name";
    nameInput.value = node.name || "";
    nameSection.appendChild(nameLabel);
    nameSection.appendChild(nameInput);

    const typeSection = document.createElement("div");
    typeSection.className = "panel-section";
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Tipo de nodo";
    const typeSelect = document.createElement("select");
    typeSelect.id = "node-type";
    ORDERED_NODE_TYPES.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      typeSelect.appendChild(opt);
    });
    typeSection.appendChild(typeLabel);
    typeSection.appendChild(typeSelect);

    const btnSection = document.createElement("div");
    btnSection.className = "panel-section";
    const setStartBtn = document.createElement("button");
    setStartBtn.id = "set-start-node";
    setStartBtn.className = "btn small";
    setStartBtn.style.width = "100%";
    setStartBtn.textContent = "Establecer como nodo inicial";
    btnSection.appendChild(setStartBtn);

    const specificContainer = document.createElement("div");
    specificContainer.className = "panel-section";
    specificContainer.id = "node-specific";

    const nextContainer = document.createElement("div");
    nextContainer.id = "node-next-container";

    root.appendChild(nameSection);
    root.appendChild(typeSection);
    root.appendChild(btnSection);
    root.appendChild(specificContainer);
    root.appendChild(nextContainer);

    inspector.appendChild(root);

    nameInput.addEventListener("change", () => {
      node.name = nameInput.value;
      this.projectStore.notify();
    });

    typeSelect.value = node.type || "dialogue";
    typeSelect.addEventListener("change", () => {
      const newType = typeSelect.value;
      if (newType === node.type) return;
      convertNodeType(node, newType);
      this.projectStore.notify();
    });

    setStartBtn.addEventListener("click", () => {
      scene.graph.startNodeId = node.id;
      this.projectStore.notify();
    });

    renderNodeTypeFields(node, specificContainer, this.projectStore);
    renderNextSelectors(node, nextContainer, scene, this.projectStore);
  }

  refresh(selectedNodeId) {
    this.renderContent(selectedNodeId);
  }
}
