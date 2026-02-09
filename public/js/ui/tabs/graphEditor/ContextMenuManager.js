import { ORDERED_NODE_TYPES } from "../../../models/nodes/nodeTypes.js";
import { generateId } from "../../../utils/idGenerator.js";
import { showInfo } from "../../notifications.js";
import { DEFAULT_VALUES } from "./constants.js";
import { escapeHtml } from "../../../utils/sanitize.js";
import {
  serializeNode,
  createNodeFromRaw,
} from "../../../models/nodes/nodeFactory.js";
import { AddNodeCommand } from "../../../commands/AddNodeCommand.js";
import { DeleteNodeCommand } from "../../../commands/DeleteNodeCommand.js";

export class ContextMenuManager {
  constructor(
    projectStore,
    onCreateNode,
    onDuplicateNode,
    onDeleteNode,
    onDuplicateMany = null,
    onDeleteMany = null
  ) {
    this.projectStore = projectStore;
    this.onCreateNode = onCreateNode;
    this.onDuplicateNode = onDuplicateNode;
    this.onDeleteNode = onDeleteNode;
    this.onDuplicateMany = onDuplicateMany;
    this.onDeleteMany = onDeleteMany;
    this.contextMenu = null;
    this.selectionIds = null;
  }

  showCanvasContextMenu(x, y, graphCanvas, event) {
    this.closeContextMenu();

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const label = document.createElement("div");
    label.className = "context-menu-label";
    label.textContent = "Crear Nodo";
    menu.appendChild(label);

    ORDERED_NODE_TYPES.forEach((nodeType) => {
      const item = document.createElement("div");
      item.className = "context-menu-item";
      item.textContent = nodeType;
      item.addEventListener("click", (e) => {
        e.stopPropagation();

        const container = graphCanvas;
        const containerRect = container.getBoundingClientRect();
        const scrollParent = container.closest(".graph-canvas");

        const xPos =
          event.clientX - containerRect.left + scrollParent.scrollLeft;
        const yPos = event.clientY - containerRect.top + scrollParent.scrollTop;

        this.createNodeAtPosition(nodeType, xPos, yPos);
        this.closeContextMenu();
      });
      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    this.contextMenu = menu;

    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${y - rect.height}px`;
    }
  }

  showNodeContextMenu(x, y, nodeId, { selectionIds = null } = {}) {
    this.closeContextMenu();
    this.selectionIds = Array.isArray(selectionIds) ? selectionIds : null;

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const duplicateItem = document.createElement("div");
    duplicateItem.className = "context-menu-item";
    duplicateItem.textContent = "Duplicar";
    duplicateItem.addEventListener("click", (e) => {
      e.stopPropagation();
      const ids =
        this.selectionIds && this.selectionIds.length
          ? this.selectionIds
          : [nodeId];
      if (ids.length > 1 && this.onDuplicateMany) {
        this.onDuplicateMany(ids);
      } else {
        this.duplicateNode(nodeId);
      }
      this.closeContextMenu();
    });
    menu.appendChild(duplicateItem);

    const divider = document.createElement("div");
    divider.className = "context-menu-divider";
    menu.appendChild(divider);

    const deleteItem = document.createElement("div");
    deleteItem.className = "context-menu-item";
    deleteItem.textContent = "Eliminar";
    deleteItem.addEventListener("click", (e) => {
      e.stopPropagation();
      const ids =
        this.selectionIds && this.selectionIds.length
          ? this.selectionIds
          : [nodeId];
      if (ids.length > 1 && this.onDeleteMany) {
        this.onDeleteMany(ids);
      } else {
        this.deleteSingleNode(nodeId);
      }
      this.closeContextMenu();
    });
    menu.appendChild(deleteItem);

    document.body.appendChild(menu);
    this.contextMenu = menu;

    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${y - rect.height}px`;
    }
  }

  closeContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }
  }

  createNodeAtPosition(type, x, y) {
    const scene = this.projectStore.currentScene;
    if (!scene) return;

    const rawNode = {
      id: generateId("node"),
      type,
      name: type,
      x: Math.max(0, x - DEFAULT_VALUES.NODE_OFFSET_X),
      y: Math.max(0, y - DEFAULT_VALUES.NODE_OFFSET_Y),
      data: {},
      nextNodeIds: [],
    };

    const node = createNodeFromRaw(rawNode);

    const command = new AddNodeCommand(scene, node);
    this.projectStore.executeCommand(command);

    if (!scene.graph.startNodeId) {
      scene.graph.startNodeId = node.id;
    }

    if (this.onCreateNode) {
      this.onCreateNode(node.id);
    }
  }

  duplicateNode(nodeId) {
    const scene = this.projectStore.currentScene;
    if (!scene) return;

    const originalNode = scene.graph.getNode(nodeId);
    if (!originalNode) return;

    const serialized = serializeNode(originalNode);
    const newNode = createNodeFromRaw({
      ...serialized,
      id: generateId("node"),
      name: `${escapeHtml(originalNode.name)} (copia)`,
      x: (originalNode.x || 0) + DEFAULT_VALUES.DUPLICATE_OFFSET_X,
      y: (originalNode.y || 0) + DEFAULT_VALUES.DUPLICATE_OFFSET_Y,
    });

    const command = new AddNodeCommand(scene, newNode);
    this.projectStore.executeCommand(command);

    if (this.onDuplicateNode) {
      this.onDuplicateNode(newNode.id);
    }

    showInfo("Nodo duplicado correctamente", 2000);
  }

  deleteSingleNode(nodeId) {
    const scene = this.projectStore.currentScene;
    if (!scene) {
      return;
    }

    const node = scene.graph.getNode(nodeId);
    if (!node) {
      return;
    }

    if (confirm(`¿Eliminar nodo "${escapeHtml(node.name)}"?`)) {
      const command = new DeleteNodeCommand(scene, nodeId);
      const success = this.projectStore.executeCommand(command);

      if (success && this.onDeleteNode) {
        this.onDeleteNode(nodeId);
      }
      showInfo("Nodo eliminado", 2000);
    }
  }

  destroy() {
    this.closeContextMenu();
  }
}
