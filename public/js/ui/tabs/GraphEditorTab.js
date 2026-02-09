import { ScenePanel } from "./graphEditor/ScenePanel.js";
import { NodeRenderer } from "./graphEditor/NodeRenderer.js";
import { NodeInspector } from "./graphEditor/NodeInspector.js";
import { ContextMenuManager } from "./graphEditor/ContextMenuManager.js";
import { KeyboardShortcuts } from "../KeyboardShortcuts.js";
import { generateId } from "../../utils/idGenerator.js";
import { escapeHtml } from "../../utils/sanitize.js";
import { DEFAULT_VALUES } from "./graphEditor/constants.js";
import { showInfo, showError } from "../notifications.js";
import {
  serializeNode,
  createNodeFromRaw,
} from "../../models/nodes/nodeFactory.js";
import { AddNodeCommand } from "../../commands/AddNodeCommand.js";
import { DeleteNodeCommand } from "../../commands/DeleteNodeCommand.js";
import { MultiCommand } from "../../commands/MultiCommand.js";

export class GraphEditorTab {
  constructor(projectStore) {
    this.projectStore = projectStore;
    this.root = null;
    this.selectedNodeId = null; // selección principal (para inspector)
    this.selectedNodeIds = new Set();
    this.eventListeners = [];
    this.boundCloseContextMenu = this.closeContextMenu.bind(this);
    this.clipboard = null;
    this.keyboardShortcuts = null;

    this.scenePanel = new ScenePanel(
      projectStore,
      this.handleSceneSelect.bind(this)
    );
    this.nodeRenderer = new NodeRenderer(
      projectStore,
      this.handleNodeSelect.bind(this),
      this.handleNodeContextMenu.bind(this)
    );
    this.nodeInspector = new NodeInspector(projectStore);
    this.contextMenuManager = new ContextMenuManager(
      projectStore,
      this.handleNodeCreated.bind(this),
      this.handleNodeDuplicated.bind(this),
      this.handleNodeDeleted.bind(this),
      this.duplicateSelectionFromContext.bind(this),
      this.deleteSelectionFromContext.bind(this)
    );

    this.unsubscribe = this.projectStore.subscribe(() => this.refresh());

    this.dragEnabled = false;
    this.dragToggleBtn = null;
    this.autoLayoutBtn = null;
    this.searchInput = null;
    this.searchNextBtn = null;
    this.searchClearBtn = null;
    this.toolsToggleBtn = null;
    this.toolsPanel = null;
    this.toolsContainer = null;
    this.searchQuery = "";
    this.searchMatches = [];
    this.searchIndex = -1;
    this.pendingScrollNodeId = null;
    this.toolsExpanded = false;
    this.resizeObserver = null;
    this.resizeTimeout = null;
    this.marqueeBox = null;
    this.marqueeStart = null;
    this.marqueeLastPoint = null;
    this.marqueeAdditive = false;
    this.isMarqueeActive = false;
  }

  render() {
    if (!this.unsubscribe) {
      this.unsubscribe = this.projectStore.subscribe(() => this.refresh());
    }
    this.root = document.createElement("div");
    this.root.style.display = "flex";
    this.root.style.width = "100%";
    this.root.style.height = "100%";
    this.root.tabIndex = 0;
    this.root.style.outline = "none";

    const leftPanel = this.scenePanel.render();
    const center = this.createCenterPanel();
    const rightPanel = this.nodeInspector.render();

    this.root.appendChild(leftPanel);
    this.root.appendChild(center);
    this.root.appendChild(rightPanel);

    this.attachGlobalHandlers(center);
    this.setupKeyboardShortcuts();
    this.refresh();

    setTimeout(() => {
      if (this.root) {
        this.root.focus();
      }
    }, 100);

    return this.root;
  }

  createCenterPanel() {
    const wrapper = document.createElement("div");
    wrapper.className = "graph-center";

    const toolsFloating = document.createElement("div");
    toolsFloating.className = "graph-tools-floating";

    const toolsToggle = document.createElement("button");
    toolsToggle.id = "graph-tools-toggle";
    toolsToggle.className = "btn small graph-floating-toggle";
    toolsToggle.textContent = "▸ Herramientas";
    toolsFloating.appendChild(toolsToggle);

    const toolbar = document.createElement("div");
    toolbar.id = "graph-toolbar-body";
    toolbar.className = "graph-floating-panel collapsed";
    toolbar.innerHTML = `
      <div class="graph-toolbar-left">
        <button id="toggle-drag" class="btn small">Mover nodos: OFF</button>
        <button id="auto-layout" class="btn small">Auto-ordenar</button>
      </div>
      <div class="graph-toolbar-right">
        <input id="graph-search" type="text" placeholder="Buscar nodo" class="graph-search-input" />
        <button id="graph-search-next" class="btn small">Siguiente</button>
        <button id="graph-search-clear" class="btn small">Limpiar</button>
      </div>
    `;
    toolsFloating.appendChild(toolbar);
    wrapper.appendChild(toolsFloating);

    this.toolsContainer = toolsFloating;
    this.dragToggleBtn = toolbar.querySelector("#toggle-drag");
    this.autoLayoutBtn = toolbar.querySelector("#auto-layout");
    this.searchInput = toolbar.querySelector("#graph-search");
    this.searchNextBtn = toolbar.querySelector("#graph-search-next");
    this.searchClearBtn = toolbar.querySelector("#graph-search-clear");
    this.toolsToggleBtn = toolsToggle;
    this.toolsPanel = toolbar;

    ["mousedown", "click"].forEach((evt) => {
      this.searchInput.addEventListener(evt, (e) => {
        e.stopPropagation();
      });
    });

    this.dragToggleBtn.addEventListener("click", () => {
      this.dragEnabled = !this.dragEnabled;
      // Actualiza inmediatamente el estado de arrastre para evitar el "segundo click"
      this.nodeRenderer.setDragEnabled(this.dragEnabled);
      this.refreshToolbar();
    });

    this.autoLayoutBtn.addEventListener("click", () => {
      this.nodeRenderer.requestAutoLayout();
      this.refresh();
    });

    this.searchInput.addEventListener("input", () => {
      this.searchQuery = this.searchInput.value || "";
      this.searchIndex = -1;
      this.refresh();
    });

    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.gotoNextMatch();
      }
    });

    this.searchNextBtn.addEventListener("click", () => {
      this.gotoNextMatch();
    });

    this.searchClearBtn.addEventListener("click", () => {
      this.searchQuery = "";
      this.searchInput.value = "";
      this.searchMatches = [];
      this.searchIndex = -1;
      this.refresh();
    });

    this.toolsToggleBtn.addEventListener("click", () => {
      this.toolsExpanded = !this.toolsExpanded;
      this.refreshToolbar();
    });

    const canvas = document.createElement("div");
    canvas.className = "graph-canvas";
    canvas.innerHTML = `<div class="graph-nodes-container" id="graph-nodes"></div>`;
    wrapper.appendChild(canvas);

    this.setupResizeObserver(canvas);
    this.setupMarqueeSelection(canvas);

    return wrapper;
  }

  attachGlobalHandlers(center) {
    center.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".node-card")) return;
      e.preventDefault();
      const graphNodesContainer = center.querySelector("#graph-nodes");
      this.contextMenuManager.showCanvasContextMenu(
        e.clientX,
        e.clientY,
        graphNodesContainer,
        e
      );
    });

    this.addManagedEventListener(document, "click", this.boundCloseContextMenu);

    center.addEventListener("click", () => {
      if (this.root) {
        this.root.focus();
      }
    });
  }

  setupKeyboardShortcuts() {
    if (this.keyboardShortcuts) {
      this.keyboardShortcuts.destroy();
    }

    this.keyboardShortcuts = new KeyboardShortcuts(this.root);

    this.keyboardShortcuts.register(
      "ctrl+c",
      () => {
        this.copyNode();
      },
      "Copiar nodos seleccionados"
    );

    this.keyboardShortcuts.register(
      "ctrl+v",
      () => {
        this.pasteNode();
      },
      "Pegar nodo"
    );

    this.keyboardShortcuts.register(
      "ctrl+x",
      () => {
        this.cutNode();
      },
      "Cortar nodo"
    );

    this.keyboardShortcuts.register(
      "ctrl+d",
      () => {
        this.duplicateNode();
      },
      "Duplicar nodo"
    );

    this.keyboardShortcuts.register(
      "delete",
      () => {
        this.deleteNode();
      },
      "Eliminar nodo"
    );

    this.keyboardShortcuts.register(
      "backspace",
      () => {
        this.deleteNode();
      },
      "Eliminar nodo"
    );

    this.keyboardShortcuts.register(
      "escape",
      () => {
        this.clearSelection();
        this.refresh();
      },
      "Deseleccionar nodos"
    );

    this.keyboardShortcuts.register(
      "ctrl+z",
      () => {
        this.undo();
      },
      "Deshacer"
    );

    this.keyboardShortcuts.register(
      "ctrl+y",
      () => {
        this.redo();
      },
      "Rehacer"
    );

    this.keyboardShortcuts.register(
      "ctrl+shift+z",
      () => {
        this.redo();
      },
      "Rehacer"
    );

    this.keyboardShortcuts.enable();
  }

  copyNode() {
    if (!this.selectedNodeIds.size) {
      showError("No hay nodos seleccionados", 2000);
      return;
    }

    const scene = this.projectStore.currentScene;
    if (!scene) return;

    const serialized = Array.from(this.selectedNodeIds)
      .map((id) => scene.graph.getNode(id))
      .filter(Boolean)
      .map((node) => serializeNode(node));
    if (!serialized.length) return;

    this.clipboard = { nodes: serialized };
    const count = serialized.length;
    showInfo(
      count === 1
        ? "Nodo copiado al portapapeles"
        : `${count} nodos copiados al portapapeles`,
      2000
    );
  }

  cutNode() {
    if (!this.selectedNodeIds.size) {
      showError("No hay nodos seleccionados", 2000);
      return;
    }

    this.copyNode();
    this.deleteNode();
  }

  pasteNode() {
    if (
      !this.clipboard ||
      !this.clipboard.nodes ||
      !this.clipboard.nodes.length
    ) {
      showError("El portapapeles está vacío", 2000);
      return;
    }

    const scene = this.projectStore.currentScene;
    if (!scene) return;

    const cloned = this.cloneNodes(this.clipboard.nodes);
    this.addNodesToScene(scene, cloned);
    showInfo(
      cloned.length === 1
        ? "Nodo pegado correctamente"
        : `${cloned.length} nodos pegados`,
      2000
    );
  }

  duplicateNode() {
    if (!this.selectedNodeIds.size) {
      showError("No hay nodos seleccionados", 2000);
      return;
    }

    const scene = this.projectStore.currentScene;
    if (!scene) return;

    const selectedSerialized = Array.from(this.selectedNodeIds)
      .map((id) => scene.graph.getNode(id))
      .filter(Boolean)
      .map((node) => serializeNode(node));
    if (!selectedSerialized.length) return;

    const cloned = this.cloneNodes(selectedSerialized);
    this.addNodesToScene(scene, cloned);
    showInfo(
      cloned.length === 1
        ? "Nodo duplicado correctamente"
        : `${cloned.length} nodos duplicados`,
      2000
    );
  }

  deleteNode() {
    if (!this.selectedNodeIds.size) {
      showError("No hay nodos seleccionados", 2000);
      return;
    }

    const scene = this.projectStore.currentScene;
    if (!scene) return;

    const ids = Array.from(this.selectedNodeIds);
    const names = ids
      .map((id) => scene.graph.getNode(id))
      .filter(Boolean)
      .map((n) => n.name || n.id);
    if (!names.length) return;

    const label =
      names.length === 1
        ? `¿Eliminar nodo "${escapeHtml(names[0])}"?`
        : `¿Eliminar ${names.length} nodos seleccionados?`;
    if (confirm(label)) {
      const commands = ids.map((id) => new DeleteNodeCommand(scene, id));
      const multi = new MultiCommand(
        commands,
        `Eliminar ${commands.length} nodo(s)`
      );
      this.projectStore.executeCommand(multi);
      this.clearSelection();
      showInfo(
        names.length === 1
          ? "Nodo eliminado"
          : `${names.length} nodos eliminados`,
        2000
      );
    }
  }

  undo() {
    console.log("[Undo] Can undo:", this.projectStore.canUndo());
    if (!this.projectStore.canUndo()) {
      showError("No hay nada que deshacer", 2000);
      return;
    }

    const success = this.projectStore.undo();
    console.log("[Undo] Success:", success);
    if (success) {
      showInfo("Deshecho", 1500);
      const scene = this.projectStore.currentScene;
      if (scene && this.selectedNodeIds.size) {
        const removed = [];
        this.selectedNodeIds.forEach((id) => {
          if (!scene.graph.getNode(id)) {
            removed.push(id);
          }
        });
        removed.forEach((id) => this.selectedNodeIds.delete(id));
        this.selectedNodeId = this.getPrimarySelectedId();
      }
    }
  }

  redo() {
    if (!this.projectStore.canRedo()) {
      showError("No hay nada que rehacer", 2000);
      return;
    }

    const success = this.projectStore.redo();
    if (success) {
      showInfo("Rehecho", 1500);
    }
  }

  addManagedEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  handleSceneSelect(nodeId) {
    if (nodeId) {
      this.setSelection([nodeId]);
    } else {
      this.clearSelection();
    }
    this.refresh();
  }

  handleNodeSelect(nodeId, event) {
    if (event && (event.ctrlKey || event.metaKey)) {
      this.toggleSelection(nodeId);
    } else {
      this.setSelection([nodeId]);
    }
    this.refresh();
  }

  handleNodeContextMenu(x, y, nodeId, selectionSet) {
    const selection =
      selectionSet instanceof Set ? selectionSet : this.selectedNodeIds;
    const rightClickOnSelected = selection && selection.has(nodeId);
    if (!rightClickOnSelected) {
      this.setSelection([nodeId]);
    }
    const idsForMenu = rightClickOnSelected ? Array.from(selection) : [nodeId];
    this.contextMenuManager.showNodeContextMenu(x, y, nodeId, {
      selectionIds: idsForMenu,
    });
  }

  handleNodeCreated(nodeId) {
    this.setSelection([nodeId]);
    this.refresh();
  }

  handleNodeDuplicated(nodeId) {
    this.setSelection([nodeId]);
    this.refresh();
  }

  handleNodeDeleted(nodeId) {
    if (this.selectedNodeId === nodeId) {
      this.selectedNodeId = null;
    }
    if (this.selectedNodeIds.has(nodeId)) {
      this.selectedNodeIds.delete(nodeId);
    }
    this.selectedNodeId = this.getPrimarySelectedId();
    this.refresh();
  }

  duplicateSelectionFromContext(ids) {
    this.setSelection(ids);
    this.duplicateNode();
  }

  deleteSelectionFromContext(ids) {
    this.setSelection(ids);
    this.deleteNode();
  }

  closeContextMenu() {
    this.contextMenuManager.closeContextMenu();
  }

  setSelection(ids = []) {
    this.selectedNodeIds = new Set(ids.filter(Boolean));
    this.selectedNodeId = this.getPrimarySelectedId();
  }

  clearSelection() {
    this.selectedNodeIds.clear();
    this.selectedNodeId = null;
  }

  toggleSelection(nodeId) {
    if (!nodeId) return;
    if (this.selectedNodeIds.has(nodeId)) {
      this.selectedNodeIds.delete(nodeId);
    } else {
      this.selectedNodeIds.add(nodeId);
    }
    this.selectedNodeId = this.getPrimarySelectedId();
  }

  getPrimarySelectedId() {
    const iter = this.selectedNodeIds.values().next();
    return iter && !iter.done ? iter.value : null;
  }

  cloneNodes(serializedNodes) {
    const idMap = new Map();
    const clones = serializedNodes.map((raw) => {
      const newId = generateId("node");
      idMap.set(raw.id, newId);
      return createNodeFromRaw({
        ...raw,
        id: newId,
        name: `${raw.name || raw.type || raw.id} (copia)`,
        x:
          (typeof raw.x === "number" ? raw.x : 0) +
          DEFAULT_VALUES.DUPLICATE_OFFSET_X,
        y:
          (typeof raw.y === "number" ? raw.y : 0) +
          DEFAULT_VALUES.DUPLICATE_OFFSET_Y,
      });
    });

    clones.forEach((node) => {
      node.nextNodeIds = (node.nextNodeIds || []).map((targetId) =>
        idMap.has(targetId) ? idMap.get(targetId) : targetId
      );
    });

    return clones;
  }

  addNodesToScene(scene, nodes) {
    const newIds = [];
    const commands = [];
    nodes.forEach((node) => {
      commands.push(new AddNodeCommand(scene, node));
      newIds.push(node.id);
    });
    if (commands.length) {
      const multi = new MultiCommand(
        commands,
        `Agregar ${commands.length} nodo(s)`
      );
      this.projectStore.executeCommand(multi);
      this.setSelection(newIds);
    }
  }

  refresh() {
    if (!this.root) return;

    this.scenePanel.refresh();

    this.refreshToolbar();

    this.updateSearchMatches();

    const container = this.root.querySelector("#graph-nodes");
    const scrollParent = this.root.querySelector(".graph-canvas");
    this.nodeRenderer.setDragEnabled(this.dragEnabled);
    this.nodeRenderer.setSearchMatches(new Set(this.searchMatches));
    this.nodeRenderer.setSelectedNodeIds(this.selectedNodeIds);
    this.nodeRenderer.render(container, scrollParent);

    const primaryId = this.getPrimarySelectedId();
    this.nodeInspector.refresh(primaryId);

    if (this.pendingScrollNodeId && scrollParent) {
      this.scrollToNode(this.pendingScrollNodeId, scrollParent);
      this.pendingScrollNodeId = null;
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.keyboardShortcuts) {
      this.keyboardShortcuts.destroy();
      this.keyboardShortcuts = null;
    }
    this.contextMenuManager.destroy();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  refreshToolbar() {
    if (!this.dragToggleBtn) return;
    const hasProject = !!this.projectStore.project;
    const hasScene =
      hasProject &&
      Array.isArray(this.projectStore.scenes) &&
      this.projectStore.scenes.length > 0;
    const hasNodes =
      hasScene &&
      this.projectStore.currentScene &&
      this.projectStore.currentScene.graph &&
      this.projectStore.currentScene.graph.nodes &&
      this.projectStore.currentScene.graph.nodes.size > 0;

    const showTools = hasProject && hasScene && hasNodes;

    if (this.toolsContainer) {
      this.toolsContainer.style.display = showTools ? "flex" : "none";
    }
    if (!showTools) {
      return;
    }
    this.dragToggleBtn.textContent = this.dragEnabled
      ? "Mover nodos: ON"
      : "Mover nodos: OFF";
    if (this.dragEnabled) {
      this.dragToggleBtn.classList.add("primary");
    } else {
      this.dragToggleBtn.classList.remove("primary");
    }

    if (this.toolsToggleBtn && this.toolsPanel) {
      if (this.toolsExpanded) {
        this.toolsToggleBtn.textContent = "▾ Herramientas";
        this.toolsPanel.classList.remove("collapsed");
      } else {
        this.toolsToggleBtn.textContent = "▸ Herramientas";
        this.toolsPanel.classList.add("collapsed");
      }
    }
  }

  updateSearchMatches() {
    const scene = this.projectStore.currentScene;
    if (!scene || !this.searchQuery.trim()) {
      this.searchMatches = [];
      this.searchIndex = -1;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    const matches = [];
    scene.graph.nodes.forEach((node) => {
      const name = (node.name || "").toLowerCase();
      const type = (node.type || "").toLowerCase();
      const id = (node.id || "").toLowerCase();
      if (name.includes(q) || type.includes(q) || id.includes(q)) {
        matches.push(node.id);
      }
    });
    this.searchMatches = matches;
    if (this.searchIndex >= this.searchMatches.length) {
      this.searchIndex = -1;
    }
  }

  gotoNextMatch() {
    if (!this.searchMatches.length) return;
    this.searchIndex = (this.searchIndex + 1) % this.searchMatches.length;
    const targetId = this.searchMatches[this.searchIndex];
    this.pendingScrollNodeId = targetId;
    this.setSelection([targetId]);
    this.refresh();
  }

  scrollToNode(nodeId, scrollParent) {
    const el = this.root.querySelector(`.node-card[data-node-id="${nodeId}"]`);
    if (!el) return;
    const targetLeft =
      el.offsetLeft - scrollParent.clientWidth / 2 + el.offsetWidth / 2;
    const targetTop =
      el.offsetTop - scrollParent.clientHeight / 2 + el.offsetHeight / 2;
    scrollParent.scrollTo({
      left: Math.max(0, targetLeft),
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }

  setupResizeObserver(canvas) {
    if (!canvas || this.resizeObserver) return;
    if (typeof ResizeObserver === "undefined") {
      const handler = () => this.scheduleRefresh();
      window.addEventListener("resize", handler);
      this.addManagedEventListener(window, "resize", handler);
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleRefresh();
    });
    this.resizeObserver.observe(canvas);
  }

  setupMarqueeSelection(canvas) {
    if (!canvas) return;
    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.closest(".node-card")) return;
      this.isMarqueeActive = true;
      this.marqueeAdditive = e.ctrlKey || e.metaKey;
      this.marqueeStart = this.getCanvasCoordinates(canvas, e.clientX, e.clientY);
      this.marqueeLastPoint = { x: e.clientX, y: e.clientY };
      this.marqueeBox = document.createElement("div");
      this.marqueeBox.className = "selection-rectangle";
      canvas.appendChild(this.marqueeBox);
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!this.isMarqueeActive) return;
      this.marqueeLastPoint = { x: e.clientX, y: e.clientY };
      this.updateMarqueeBox(canvas, e);
    };

    const onMouseUp = (e) => {
      if (!this.isMarqueeActive) return;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      this.finishMarqueeSelection(e, canvas);
      this.marqueeLastPoint = null;
    };

    const onScroll = () => {
      if (!this.isMarqueeActive || !this.marqueeLastPoint) return;
      this.updateMarqueeBox(canvas, {
        clientX: this.marqueeLastPoint.x,
        clientY: this.marqueeLastPoint.y,
      });
    };

    this.addManagedEventListener(canvas, "mousedown", onMouseDown);
    this.addManagedEventListener(canvas, "scroll", onScroll);
  }

  getCanvasCoordinates(canvas, clientX, clientY) {
    const canvasRect = canvas.getBoundingClientRect();
    return {
      x: clientX - canvasRect.left + canvas.scrollLeft,
      y: clientY - canvasRect.top + canvas.scrollTop,
    };
  }

  updateMarqueeBox(canvas, event) {
    if (!this.marqueeBox || !this.marqueeStart) return;
    const current = this.getCanvasCoordinates(canvas, event.clientX, event.clientY);
    const left = Math.min(this.marqueeStart.x, current.x);
    const top = Math.min(this.marqueeStart.y, current.y);
    const width = Math.abs(current.x - this.marqueeStart.x);
    const height = Math.abs(current.y - this.marqueeStart.y);

    Object.assign(this.marqueeBox.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
  }

  finishMarqueeSelection(event, canvas) {
    this.isMarqueeActive = false;
    const start =
      this.marqueeStart ||
      this.getCanvasCoordinates(canvas, event.clientX, event.clientY);
    const end = this.getCanvasCoordinates(canvas, event.clientX, event.clientY);
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);

    if (this.marqueeBox && this.marqueeBox.parentNode) {
      this.marqueeBox.parentNode.removeChild(this.marqueeBox);
    }
    this.marqueeBox = null;
    this.marqueeStart = null;
    this.marqueeLastPoint = null;

    const hits = this.collectNodesInCanvasRect(canvas, x1, y1, x2, y2);
    if (!hits.length) {
      if (!this.marqueeAdditive) {
        this.clearSelection();
      }
      this.marqueeAdditive = false;
      this.refresh();
      return;
    }

    if (this.marqueeAdditive) {
      hits.forEach((id) => this.selectedNodeIds.add(id));
      this.selectedNodeId = this.getPrimarySelectedId();
    } else {
      this.setSelection(hits);
    }
    this.marqueeAdditive = false;
    this.refresh();
  }

  collectNodesInCanvasRect(canvas, x1, y1, x2, y2) {
    if (!this.root || !canvas) return [];
    const container = this.root.querySelector("#graph-nodes");
    if (!container) return [];
    const canvasRect = canvas.getBoundingClientRect();
    const nodes = container.querySelectorAll(".node-card");
    const selected = [];
    nodes.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const left = rect.left - canvasRect.left + canvas.scrollLeft;
      const right = rect.right - canvasRect.left + canvas.scrollLeft;
      const top = rect.top - canvasRect.top + canvas.scrollTop;
      const bottom = rect.bottom - canvasRect.top + canvas.scrollTop;
      const intersects = !(
        right < x1 ||
        left > x2 ||
        bottom < y1 ||
        top > y2
      );
      if (intersects && el.dataset.nodeId) {
        selected.push(el.dataset.nodeId);
      }
    });
    return selected;
  }

  scheduleRefresh() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.refresh();
    }, 60);
  }
}
