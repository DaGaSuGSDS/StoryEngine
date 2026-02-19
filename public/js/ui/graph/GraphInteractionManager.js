
import { KeyboardShortcuts } from "../KeyboardShortcuts.js";
import { generateId } from "../../utils/idGenerator.js";
import { escapeHtml } from "../../utils/sanitize.js";
import { DEFAULT_VALUES } from "../tabs/graphEditor/constants.js";
import { showInfo, showError } from "../notifications.js";
import {
    serializeNode,
    createNodeFromRaw,
} from "../../models/nodes/nodeFactory.js";
import { AddNodeCommand } from "../../commands/AddNodeCommand.js";
import { DeleteNodeCommand } from "../../commands/DeleteNodeCommand.js";
import { ConnectNodeCommand } from "../../commands/ConnectNodeCommand.js";
import { DisconnectNodeCommand } from "../../commands/DisconnectNodeCommand.js";
import { MultiCommand } from "../../commands/MultiCommand.js";

/**
 * Manages user interactions on the Graph Canvas.
 * Handles:
 * - Selection (single, multi, toggle)
 * - Clipboard operations (Copy, Cut, Paste, Duplicate)
 * - Deletion
 * - Keyboard shortcuts (Delegated to KeyboardShortcuts helper)
 * - Marquee selection (Box selection)
 * - Context Menu triggers
 */
export class GraphInteractionManager {
    /**
     * @param {Object} projectStore
     * @param {Object} contextMenuManager
     * @param {Object} callbacks
     */
    constructor(projectStore, contextMenuManager, callbacks = {}) {
        this.projectStore = projectStore;
        this.contextMenuManager = contextMenuManager;
        this.callbacks = {
            onRefresh: () => { },
            onSelectionChange: () => { },
            ...callbacks
        };

        this.selectedNodeIds = new Set();
        this.selectedNodeId = null;
        this.clipboard = null;
        this.keyboardShortcuts = null;

        // Marquee state
        this.marqueeBox = null;
        this.marqueeStart = null;
        this.marqueeLastPoint = null;
        this.marqueeAdditive = false;
        this.isMarqueeActive = false;

        // Bind methods for passing as callbacks
        this.handleNodeSelect = this.handleNodeSelect.bind(this);
        this.handleNodeContextMenu = this.handleNodeContextMenu.bind(this);
    }

    /**
     * Initializes the interaction manager.
     * @param {HTMLElement} rootElement
     * @param {HTMLElement} canvasElement
     */
    init(rootElement, canvasElement) {
        this.root = rootElement; // Needed for querying .node-card for marquee
        this.canvas = canvasElement;
        this.setupKeyboardShortcuts(rootElement);
        this.setupMarqueeSelection(canvasElement);

        // Global context menu close
        this.closeMenuHandler = () => this.contextMenuManager.closeContextMenu();
        document.addEventListener("click", this.closeMenuHandler);
    }

    /**
     * Cleans up listeners.
     */
    destroy() {
        if (this.keyboardShortcuts) {
            this.keyboardShortcuts.destroy();
        }
        if (this.closeMenuHandler) {
            document.removeEventListener("click", this.closeMenuHandler);
        }
    }

    // --- Selection Management ---

    /**
     * Sets the current selection.
     * @param {Array<string>} ids
     */
    setSelection(ids = []) {
        this.selectedEdge = null; // Clear edge selection when selecting nodes
        this.selectedNodeIds = new Set(ids.filter(Boolean));
        this.selectedNodeId = this.getPrimarySelectedId();
        this.callbacks.onSelectionChange(this.selectedNodeIds);
        this.callbacks.onRefresh();
        // Notify edge selection cleared? Renderer handles it via refresh
    }

    /**
     * Selects an edge.
     * @param {string} sourceId
     * @param {string} targetId
     */
    selectEdge(sourceId, targetId) {
        this.selectedNodeIds.clear(); // Clear node selection
        this.selectedNodeId = null;
        this.selectedEdge = { sourceId, targetId };
        this.callbacks.onSelectionChange(this.selectedNodeIds); // Empty set
        this.callbacks.onRefresh();
    }

    /**
     * Clears all selection.
     */
    clearSelection() {
        this.selectedNodeIds.clear();
        this.selectedNodeId = null;
        this.selectedEdge = null;
        this.callbacks.onSelectionChange(this.selectedNodeIds);
        this.callbacks.onRefresh();
    }

    /**
     * Toggles selection state of a node.
     * @param {string} nodeId
     */
    toggleSelection(nodeId) {
        if (!nodeId) return;
        if (this.selectedNodeIds.has(nodeId)) {
            this.selectedNodeIds.delete(nodeId);
        } else {
            this.selectedNodeIds.add(nodeId);
        }
        this.selectedNodeId = this.getPrimarySelectedId();
        this.callbacks.onSelectionChange(this.selectedNodeIds);
        this.callbacks.onRefresh();
    }

    /**
     * Gets the primary selected node ID.
     * @returns {string|null}
     */
    getPrimarySelectedId() {
        const iter = this.selectedNodeIds.values().next();
        return iter && !iter.done ? iter.value : null;
    }

    // --- Node Events Handlers ---

    /**
     * Handles node selection event.
     * @param {string} nodeId
     * @param {Event} event
     */
    handleNodeSelect(nodeId, event) {
        if (event && (event.ctrlKey || event.metaKey)) {
            this.toggleSelection(nodeId);
        } else {
            this.setSelection([nodeId]);
        }
    }

    /**
     * Handles node context menu event.
     * @param {number} x
     * @param {number} y
     * @param {string} nodeId
     * @param {Set} selection
     */
    handleNodeContextMenu(x, y, nodeId, selection) {
        const rightClickOnSelected = selection && selection.has(nodeId);
        if (!rightClickOnSelected) {
            this.setSelection([nodeId]);
        }
        const idsForMenu = rightClickOnSelected ? Array.from(selection) : [nodeId];
        this.contextMenuManager.showNodeContextMenu(x, y, nodeId, {
            selectionIds: idsForMenu,
        });
    }

    /**
     * Handles edge context menu event.
     * @param {number} x
     * @param {number} y
     * @param {string} sourceId
     * @param {string} targetId
     */
    handleEdgeContextMenu(x, y, sourceId, targetId) {
        // Ensure edge is selected
        this.selectEdge(sourceId, targetId);
        this.contextMenuManager.showEdgeContextMenu(x, y, sourceId, targetId);
    }

    // --- Actions ---

    /**
     * Copies selected nodes to clipboard.
     */
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
        showInfo(count === 1 ? "Nodo copiado" : `${count} nodos copiados`, 2000);
    }

    /**
     * Cuts selected nodes to clipboard.
     */
    cutNode() {
        if (!this.selectedNodeIds.size) {
            showError("No hay nodos seleccionados", 2000);
            return;
        }
        this.copyNode();
        this.deleteNode();
    }

    /**
     * Pastes nodes from clipboard.
     */
    pasteNode() {
        const scene = this.projectStore.currentScene;
        if (!scene) return;

        if (!this.clipboard || !this.clipboard.nodes || !this.clipboard.nodes.length) {
            showError("Portapapeles vacío", 2000);
            return;
        }

        const cloned = this.cloneNodes(this.clipboard.nodes);
        this.addNodesToScene(scene, cloned);
        showInfo(`Pegados ${cloned.length} nodos`, 2000);
    }

    /**
     * Duplicates selected nodes.
     */
    duplicateNode() {
        if (!this.selectedNodeIds.size) {
            showError("No hay seleccion", 2000);
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
        showInfo(`Duplicados ${cloned.length} nodos`, 2000);
    }

    /**
     * Deletes selected nodes or edge.
     */
    deleteNode() {
        // Edge deletion
        if (this.selectedEdge) {
            const scene = this.projectStore.currentScene;
            if (!scene) return;
            const cmd = new DisconnectNodeCommand(scene, this.selectedEdge.sourceId, this.selectedEdge.targetId);
            this.projectStore.executeCommand(cmd);
            this.clearSelection();
            return;
        }

        if (!this.selectedNodeIds.size) return;
        const scene = this.projectStore.currentScene;
        if (!scene) return;

        const ids = Array.from(this.selectedNodeIds);
        // Get names for better prompt?
        // Simplified for now
        if (!confirm(`¿Eliminar ${ids.length} nodos?`)) return;

        const commands = ids.map((id) => new DeleteNodeCommand(scene, id));
        this.projectStore.executeCommand(new MultiCommand(commands, `Eliminar ${ids.length} nodos`));
        this.clearSelection();
    }

    /**
     * Undoes last action.
     */
    undo() {
        if (this.projectStore.undo()) {
            showInfo("Deshecho", 1000);
        } else {
            showError("No hay nada que deshacer", 2000);
        }
    }

    /**
     * Redoes last undone action.
     */
    redo() {
        if (this.projectStore.redo()) {
            showInfo("Rehecho", 1000);
        } else {
            showError("No hay nada que rehacer", 2000);
        }
    }

    // --- Helpers ---

    /**
     * Clones serialized nodes with new IDs.
     * @param {Array<Object>} serializedNodes
     * @returns {Array<Object>}
     */
    cloneNodes(serializedNodes) {
        const idMap = new Map();
        const clones = serializedNodes.map((raw) => {
            const newId = generateId("node");
            idMap.set(raw.id, newId);
            return createNodeFromRaw({
                ...raw,
                id: newId,
                name: `${raw.name || raw.type} (copia)`,
                x: (typeof raw.x === "number" ? raw.x : 0) + DEFAULT_VALUES.DUPLICATE_OFFSET_X,
                y: (typeof raw.y === "number" ? raw.y : 0) + DEFAULT_VALUES.DUPLICATE_OFFSET_Y,
            });
        });
        clones.forEach((node) => {
            if (node.nextNodeIds) {
                node.nextNodeIds = node.nextNodeIds.map(tid => idMap.get(tid) || tid);
            }
        });
        return clones;
    }

    /**
     * Adds nodes to the scene command.
     * @param {Scene} scene
     * @param {Array<Object>} nodes
     */
    addNodesToScene(scene, nodes) {
        const commands = nodes.map(n => new AddNodeCommand(scene, n));
        const newIds = nodes.map(n => n.id);
        this.projectStore.executeCommand(new MultiCommand(commands, `Agregar ${nodes.length} nodos`));
        this.setSelection(newIds);
    }

    // --- Inputs ---

    /**
     * Sets up keyboard shortcuts.
     * @param {HTMLElement} root
     */
    setupKeyboardShortcuts(root) {
        this.keyboardShortcuts = new KeyboardShortcuts(root);

        this.keyboardShortcuts.register("ctrl+c", () => this.copyNode(), "Copiar");
        this.keyboardShortcuts.register("ctrl+v", () => this.pasteNode(), "Pegar");
        this.keyboardShortcuts.register("ctrl+x", () => this.cutNode(), "Cortar");
        this.keyboardShortcuts.register("ctrl+d", () => this.duplicateNode(), "Duplicar");
        this.keyboardShortcuts.register("delete", () => this.deleteNode(), "Eliminar");
        this.keyboardShortcuts.register("backspace", () => this.deleteNode(), "Eliminar");
        this.keyboardShortcuts.register("escape", () => this.clearSelection(), "Deseleccionar");
        this.keyboardShortcuts.register("ctrl+z", () => this.undo(), "Deshacer");
        this.keyboardShortcuts.register("ctrl+y", () => this.redo(), "Rehacer");
        this.keyboardShortcuts.register("ctrl+shift+z", () => this.redo(), "Rehacer");

        this.keyboardShortcuts.enable();
    }

    // --- Marquee ---

    /**
     * Converts client coordinates to canvas coordinates.
     * @param {number} clientX
     * @param {number} clientY
     * @returns {{x: number, y: number}}
     */
    getCanvasCoordinates(clientX, clientY) {
        const canvasRect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - canvasRect.left + this.canvas.scrollLeft,
            y: clientY - canvasRect.top + this.canvas.scrollTop,
        };
    }

    /**
     * Sets up marquee selection events.
     * @param {HTMLElement} canvas
     */
    setupMarqueeSelection(canvas) {
        if (!canvas) return;

        const onMouseDown = (e) => {
            // Allow panning or other interactions?
            // Assuming marquee is default on left click on empty space
            if (e.button !== 0) return;
            if (e.target.closest(".node-card")) return;

            this.isMarqueeActive = true;
            this.marqueeAdditive = e.ctrlKey || e.metaKey;

            this.marqueeStart = this.getCanvasCoordinates(e.clientX, e.clientY);
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
            this.updateMarqueeBox(e);
        };

        const onMouseUp = (e) => {
            if (!this.isMarqueeActive) return;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            this.finishMarqueeSelection(e);
        };

        const onScroll = () => {
            if (!this.isMarqueeActive || !this.marqueeLastPoint) return;
            this.updateMarqueeBox({
                clientX: this.marqueeLastPoint.x,
                clientY: this.marqueeLastPoint.y
            });
        };

        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("scroll", onScroll);

        // Store listeners to remove later if needed (simplified destroy for now)
    }

    /**
     * Updates the marquee selection box.
     * @param {Event} event
     */
    updateMarqueeBox(event) {
        if (!this.marqueeBox || !this.marqueeStart) return;
        const current = this.getCanvasCoordinates(event.clientX, event.clientY);
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

    /**
     * Finalizes marquee selection.
     * @param {Event} event
     */
    finishMarqueeSelection(event) {
        this.isMarqueeActive = false;
        // ... logic to select nodes ...
        const start =
            this.marqueeStart ||
            this.getCanvasCoordinates(event.clientX, event.clientY);
        const end = this.getCanvasCoordinates(event.clientX, event.clientY);
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

        const hits = this.collectNodesInCanvasRect(x1, y1, x2, y2);

        if (!hits.length) {
            if (!this.marqueeAdditive) {
                this.clearSelection();
            }
            return;
        }

        if (this.marqueeAdditive) {
            hits.forEach((id) => this.selectedNodeIds.add(id));
            this.selectedNodeId = this.getPrimarySelectedId();
            this.callbacks.onSelectionChange(this.selectedNodeIds);
            this.callbacks.onRefresh();
        } else {
            this.setSelection(hits);
        }
    }

    /**
     * Finds nodes intersecting with the selection rectangle.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {Array<string>} Array of node IDs.
     */
    collectNodesInCanvasRect(x1, y1, x2, y2) {
        if (!this.root || !this.canvas) return [];
        // Assuming nodes are in #graph-nodes
        const container = this.root.querySelector("#graph-nodes");
        if (!container) return [];

        const canvasRect = this.canvas.getBoundingClientRect();
        const nodes = container.querySelectorAll(".node-card");
        const selected = [];

        nodes.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const left = rect.left - canvasRect.left + this.canvas.scrollLeft;
            const right = rect.right - canvasRect.left + this.canvas.scrollLeft;
            const top = rect.top - canvasRect.top + this.canvas.scrollTop;
            const bottom = rect.bottom - canvasRect.top + this.canvas.scrollTop;

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

    // --- Connection Creation ---

    /**
     * Starts dragging a connection line.
     * @param {string} nodeId
     * @param {Event} startEvent
     */
    startConnectionDrag(nodeId, startEvent) {
        if (!nodeId || !startEvent) return;

        this.connectionStartNodeId = nodeId;
        this.connectionLine = document.createElement("div"); // Or SVG line
        this.connectionLine.className = "connection-drag-line";

        // Use SVG for the drag line
        const svgNS = "http://www.w3.org/2000/svg";
        this.dragSvg = document.createElementNS(svgNS, "svg");
        this.dragSvg.style.position = "absolute";
        this.dragSvg.style.top = "0";
        this.dragSvg.style.left = "0";
        this.dragSvg.style.width = "100%";
        this.dragSvg.style.height = "100%";
        this.dragSvg.style.pointerEvents = "none";
        this.dragSvg.style.zIndex = "999";

        this.dragLine = document.createElementNS(svgNS, "line");
        this.dragLine.setAttribute("stroke", "#4CAF50");
        this.dragLine.setAttribute("stroke-width", "2");
        this.dragLine.setAttribute("stroke-dasharray", "5,5"); // Dashed line
        this.dragSvg.appendChild(this.dragLine);

        // Append to body or a high-level container to ensure visibility over everything
        document.body.appendChild(this.dragSvg);

        const scrollParent = this.root.querySelector(".graph-canvas-container"); // Adjust selector if needed
        const scrollOffset = {
            x: scrollParent ? scrollParent.scrollLeft : 0,
            y: scrollParent ? scrollParent.scrollTop : 0
        };

        // Calculate start point relative to viewport
        const startRect = startEvent.target.getBoundingClientRect();
        this.connectionStartPoint = {
            x: startRect.left + startRect.width / 2,
            y: startRect.top + startRect.height / 2
        };

        const onMouseMove = (e) => {
            this.dragLine.setAttribute("x1", this.connectionStartPoint.x);
            this.dragLine.setAttribute("y1", this.connectionStartPoint.y);
            this.dragLine.setAttribute("x2", e.clientX);
            this.dragLine.setAttribute("y2", e.clientY);

            // Visual feedback on target candidate
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const nodeCard = target ? target.closest(".node-card") : null;

            document.querySelectorAll(".node-card.connecting").forEach(el => el.classList.remove("connecting"));

            if (nodeCard && nodeCard.dataset.nodeId && nodeCard.dataset.nodeId !== this.connectionStartNodeId) {
                nodeCard.classList.add("connecting");
            }
        };

        const onMouseUp = (e) => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            if (this.dragSvg && this.dragSvg.parentNode) {
                this.dragSvg.parentNode.removeChild(this.dragSvg);
            }
            document.querySelectorAll(".node-card.connecting").forEach(el => el.classList.remove("connecting"));

            const target = document.elementFromPoint(e.clientX, e.clientY);
            const nodeCard = target ? target.closest(".node-card") : null;

            if (nodeCard && nodeCard.dataset.nodeId && nodeCard.dataset.nodeId !== this.connectionStartNodeId) {
                this.createConnection(this.connectionStartNodeId, nodeCard.dataset.nodeId);
            }

            this.connectionStartNodeId = null;
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    /**
     * Creates a connection between two nodes.
     * @param {string} sourceId
     * @param {string} targetId
     */
    createConnection(sourceId, targetId) {
        const scene = this.projectStore.currentScene;
        if (!scene) return;

        const cmd = new ConnectNodeCommand(scene, sourceId, targetId);
        if (this.projectStore.executeCommand(cmd)) {
            showInfo("Conexión creada", 1500);
            this.callbacks.onRefresh();
        } else {
            // Already connected or failed
        }
    }
}
