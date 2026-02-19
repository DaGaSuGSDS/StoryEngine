/**
 * NodeRenderer.js
 * Component responsible for drawing nodes and edges on the canvas.
 */
import {
  NODE_TYPES,
  isLogicNodeType,
  getMaxOutputs,
} from "../../../models/nodes/nodeTypes.js";
import { autoLayoutGraph } from "../../../layout/GraphLayout.js";
import { showInfo } from "../../notifications.js";
import { escapeHtml } from "../../../utils/sanitize.js";
import { MoveNodesCommand } from "../../../commands/MoveNodesCommand.js";

export class NodeRenderer {
  /**
   * @param {Object} projectStore
   * @param {Function} onNodeSelect
   * @param {Function} onNodeContextMenu
   * @param {Function} onConnectionStart
   * @param {Function} onEdgeSelect
   * @param {Function} onEdgeContextMenu
   */
  constructor(projectStore, onNodeSelect, onNodeContextMenu, onConnectionStart, onEdgeSelect, onEdgeContextMenu) {
    this.projectStore = projectStore;
    this.onNodeSelect = onNodeSelect;
    this.onNodeContextMenu = onNodeContextMenu;
    this.onConnectionStart = onConnectionStart;
    this.onEdgeSelect = onEdgeSelect;
    this.onEdgeContextMenu = onEdgeContextMenu;
    this.scrollState = { top: 0, left: 0 };
    this.lastGraphIssuesHash = "";
    this.dragEnabled = false;
    this.autoLayoutRequested = false;
    this.searchMatches = new Set();
    this.currentCenterX = 0;
    this.lastSvg = null;
    this.lastNodesContainer = null;
    this.lastScene = null;
    this.selectedNodeIds = new Set();
    this.selectedEdge = null;
  }

  /**
   * Renders the graph.
   * @param {HTMLElement} container
   * @param {HTMLElement} scrollParent
   */
  render(container, scrollParent) {
    if (!container) return;

    if (scrollParent) {
      this.scrollState.top = scrollParent.scrollTop;
      this.scrollState.left = scrollParent.scrollLeft;
    }

    container.innerHTML = "";
    const scene = this.projectStore.currentScene;
    if (!scene) {
      container.innerHTML =
        '<div class="muted" style="padding:8px;">Crea una escena para empezar.</div>';
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width || 800;
    this.currentCenterX = width / 2;

    const shouldLayout = this.shouldAutoLayout(scene);
    let graphHeight = null;
    if (shouldLayout) {
      graphHeight = autoLayoutGraph(scene.graph, width);
      this.autoLayoutRequested = false;
    } else {
      graphHeight = this.computeGraphHeight(scene);
    }
    if (graphHeight) {
      container.style.height = `${graphHeight}px`;
    }

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add("graph-edges");
    svg.setAttribute("width", "100%");
    if (graphHeight) {
      svg.setAttribute("height", graphHeight);
      svg.style.height = `${graphHeight}px`;
    } else {
      svg.setAttribute("height", "100%");
    }

    const defs = document.createElementNS(svgNS, "defs");
    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "7");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "5");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("viewBox", "0 0 7 7");
    const markerPath = document.createElementNS(svgNS, "path");
    markerPath.setAttribute("d", "M 0 0 L 7 3.5 L 0 7 L 0 0 z");
    markerPath.setAttribute("fill", "#888888");
    markerPath.setAttribute("stroke", "none");
    marker.appendChild(markerPath);
    defs.appendChild(marker);
    svg.appendChild(defs);

    container.appendChild(svg);
    this.lastSvg = svg;
    this.lastNodesContainer = container;
    this.lastScene = scene;

    const graph = scene.graph;
    scene.graph.nodes.forEach((node) => {
      const div = this.createNodeElement(
        node,
        graph,
        container,
        scrollParent
      );
      container.appendChild(div);
    });

    this.drawEdges(svg, container, scene);
    this.showGraphIssues(scene);

    if (scrollParent) {
      scrollParent.scrollTop = this.scrollState.top;
      scrollParent.scrollLeft = this.scrollState.left;
    }
  }

  /**
   * Creates a DOM element for a node.
   * @param {Object} node
   * @param {Object} graph
   * @param {HTMLElement} container
   * @param {HTMLElement} scrollParent
   * @returns {HTMLElement}
   */
  createNodeElement(node, graph, container, scrollParent) {
    const div = document.createElement("div");
    div.className = "node-card";
    const isSelected =
      (this.selectedNodeId && node.id === this.selectedNodeId) ||
      (this.selectedNodeIds && this.selectedNodeIds.has(node.id));
    if (isSelected) {
      div.classList.add("selected");
    }
    if (this.searchMatches.has(node.id)) {
      div.classList.add("search-hit");
    }
    if (graph.startNodeId && graph.startNodeId === node.id) {
      div.classList.add("start-node");
    }
    div.dataset.nodeId = node.id;
    const left = this.currentCenterX + (node.x || 0);
    div.style.left = `${left}px`;
    div.style.top = node.y + "px";
    const tagClass = this.getTypeTagClass(node.type);
    div.innerHTML = `
      <div class="node-title">${escapeHtml(node.name || node.id)}</div>
      <div class="node-type">
        <span class="tag ${tagClass}">${escapeHtml(node.type)}</span>
      </div>
    `;
    div.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.onNodeSelect) {
        this.onNodeSelect(node.id, e);
      }
    });

    div.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      // Si se mantiene Ctrl/Cmd, solo alterna selección (no iniciar drag)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (this.onNodeSelect) {
          this.onNodeSelect(node.id, e);
        }
        return;
      }
      if (!this.dragEnabled) return;
      e.preventDefault();
      this.startDrag(e, node, div, container, scrollParent);
    });

    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const alreadySelected =
        this.selectedNodeIds && this.selectedNodeIds.has(node.id);
      // Solo cambia selección si el nodo no está ya seleccionado
      if (this.onNodeSelect && !alreadySelected) {
        this.onNodeSelect(node.id);
      }
      if (this.onNodeContextMenu) {
        this.onNodeContextMenu(
          e.clientX,
          e.clientY,
          node.id,
          this.selectedNodeIds
        );
      }
    });

    // Connection Port
    const port = document.createElement("div");
    port.className = "node-port";
    port.title = "Arrastra para conectar";
    port.addEventListener("mousedown", (e) => {
      e.stopPropagation(); // Prevent drag node
      e.preventDefault();
      if (this.onConnectionStart) {
        this.onConnectionStart(node.id, e);
      }
    });
    div.appendChild(port);

    return div;
  }

  /**
   * Gets the CSS class for a node type tag.
   * @param {string} type
   * @returns {string}
   */
  getTypeTagClass(type) {
    if (type === NODE_TYPES.DIALOGUE) return "tag-dialogue";
    if (type === NODE_TYPES.ANIMATION) return "tag-animation";
    if (type === NODE_TYPES.PLAYER_OPTIONS) return "tag-options";
    if (type === NODE_TYPES.AUDIO) return "tag-audio";
    if (type === NODE_TYPES.WAIT) return "tag-wait";
    if (type === NODE_TYPES.BACKGROUND_CHANGE) return "tag-backgroundchange";
    if (type === NODE_TYPES.SET_CHARACTER_STATE) return "tag-setcharacterstate";
    if (type === NODE_TYPES.RANDOM) return "tag-random";
    if (isLogicNodeType(type)) return "tag-logic";
    return "";
  }

  /**
   * Draws edges between nodes.
   * @param {SVGElement} svg
   * @param {HTMLElement} container
   * @param {Object} scene
   */
  drawEdges(svg, container, scene) {
    // 1. Limpieza Robusta: Eliminar solo las líneas de borde y áreas de impacto
    // Usamos querySelectorAll con las clases que vamos a añadir abajo
    svg.querySelectorAll(".edge-line, .edge-hit-area").forEach((el) => el.remove());

    const graph = scene.graph;
    const svgNS = "http://www.w3.org/2000/svg";
    const containerRect = container.getBoundingClientRect();

    // 2. Asegurar que los marcadores existan (Arrowheads)
    // Se definen de nuevo por si acaso se borraron accidentalmente
    if (!svg.querySelector("#arrowhead")) {
      const defs = svg.querySelector("defs") || document.createElementNS(svgNS, "defs");
      if (!svg.querySelector("defs")) svg.insertBefore(defs, svg.firstChild);

      const marker = document.createElementNS(svgNS, "marker");
      marker.setAttribute("id", "arrowhead");
      marker.setAttribute("markerWidth", "7");
      marker.setAttribute("markerHeight", "7");
      marker.setAttribute("refX", "5");
      marker.setAttribute("refY", "3.5");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("viewBox", "0 0 7 7");
      const markerPath = document.createElementNS(svgNS, "path");
      markerPath.setAttribute("d", "M 0 0 L 7 3.5 L 0 7 L 0 0 z");
      markerPath.setAttribute("fill", "#888888");
      markerPath.setAttribute("stroke", "none");
      marker.appendChild(markerPath);
      defs.appendChild(marker);
    }

    graph.nodes.forEach((node) => {
      const fromEl = container.querySelector(
        `.node-card[data-node-id="${node.id}"]`
      );
      if (!fromEl) return;

      // Clean up previous visual dots
      fromEl.querySelectorAll(".edge-origin-dot").forEach((el) => el.remove());

      // Reset port position to CSS default
      const port = fromEl.querySelector(".node-port");
      if (port) {
        port.style.removeProperty("left");
        port.style.removeProperty("top");
        port.style.removeProperty("transform");
        port.style.removeProperty("right");
        port.style.removeProperty("bottom");
      }

      const maxOutputs = getMaxOutputs(node.type);
      const currentOutputs = (node.nextNodeIds || []).filter((id) => id !== null).length;

      // Logic for main port visibility:
      // Show if unlimited outputs OR current outputs < max outputs
      // Hide if limit reached (user should use edge dots to modify existing)
      if (port) {
        if (maxOutputs !== Infinity && currentOutputs >= maxOutputs) {
          port.style.display = "none";
        } else {
          port.style.display = ""; // Reset to CSS default (flex/block)
        }
      }

      (node.nextNodeIds || []).forEach((nextId) => {
        const toEl = container.querySelector(
          `.node-card[data-node-id="${nextId}"]`
        );
        if (!toEl) return;

        const points = this.computeEdgePoints(
          fromEl.getBoundingClientRect(),
          toEl.getBoundingClientRect(),
          containerRect
        );

        // Calculate relative position using current DOM offset to avoid drag lag
        const relX = points.x1 - fromEl.offsetLeft;
        const relY = points.y1 - fromEl.offsetTop;

        // Visuals for ALL nodes (Extra Dots at edge origin)
        // Main port always stays fixed.
        const dot = document.createElement("div");
        dot.className = "node-port edge-origin-dot";
        dot.title = "Arrastra para conectar";
        dot.style.position = "absolute";
        dot.style.left = `${relX}px`;
        dot.style.top = `${relY}px`;
        dot.style.transform = "translate(-50%, -50%)";
        dot.style.cursor = "crosshair"; // Indicate actionable

        dot.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (this.onConnectionStart) {
            this.onConnectionStart(node.id, e);
          }
        });

        fromEl.appendChild(dot);

        // Hit area (invisible thicker line for easier clicking)
        const hitLine = document.createElementNS(svgNS, "line");
        hitLine.classList.add("edge-hit-area");
        hitLine.setAttribute("x1", points.x1);
        hitLine.setAttribute("y1", points.y1);
        hitLine.setAttribute("x2", points.x2);
        hitLine.setAttribute("y2", points.y2);
        // Use nearly transparent, not 'transparent' keyword, and paint it
        hitLine.setAttribute("stroke", "rgba(255, 0, 0, 0.001)");
        hitLine.setAttribute("stroke-width", "20"); // Even wider
        hitLine.setAttribute("fill", "none");
        hitLine.style.cursor = "pointer";
        // Explicitly enable pointer events for this element override parent
        hitLine.style.pointerEvents = "all";
        hitLine.dataset.source = node.id;
        hitLine.dataset.target = nextId;

        // Prevent marquee from starting when clicking edge
        hitLine.addEventListener("mousedown", (e) => {
          e.preventDefault(); // Also prevent dragging text etc
          e.stopPropagation();
        });

        // Event listener for selection
        hitLine.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (this.onEdgeSelect) {
            this.onEdgeSelect(node.id, nextId);
          }
        });

        // Event listener for context menu
        hitLine.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.onEdgeContextMenu) {
            this.onEdgeContextMenu(e.clientX, e.clientY, node.id, nextId);
          }
        });

        svg.appendChild(hitLine);

        // Visible line
        const line = document.createElementNS(svgNS, "line");
        line.classList.add("edge-line");
        line.setAttribute("x1", points.x1);
        line.setAttribute("y1", points.y1);
        line.setAttribute("x2", points.x2);
        line.setAttribute("y2", points.y2);
        line.setAttribute("stroke", "#888888");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("fill", "none");
        line.setAttribute("marker-end", "url(#arrowhead)");
        line.style.pointerEvents = "none"; // Let clicks pass to hitLine

        // Check if this edge is selected
        if (this.selectedEdge && this.selectedEdge.sourceId === node.id && this.selectedEdge.targetId === nextId) {
          line.setAttribute("stroke", "#4CAF50"); // Selected color
          line.setAttribute("marker-end", "url(#arrowhead-selected)");
        }

        svg.appendChild(line);
      });
    });

    // Ensure selected marker exists
    if (!svg.querySelector("#arrowhead-selected")) {
      const defs = svg.querySelector("defs") || document.createElementNS(svgNS, "defs");
      if (!svg.querySelector("defs")) svg.insertBefore(defs, svg.firstChild);

      const marker = document.createElementNS(svgNS, "marker");
      marker.setAttribute("id", "arrowhead-selected");
      marker.setAttribute("markerWidth", "7");
      marker.setAttribute("markerHeight", "7");
      marker.setAttribute("refX", "5");
      marker.setAttribute("refY", "3.5");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("viewBox", "0 0 7 7");
      const markerPath = document.createElementNS(svgNS, "path");
      markerPath.setAttribute("d", "M 0 0 L 7 3.5 L 0 7 L 0 0 z");
      markerPath.setAttribute("fill", "#4CAF50");
      markerPath.setAttribute("stroke", "none");
      marker.appendChild(markerPath);
      defs.appendChild(marker);
    }
  }

  /**
   * Checks for graph issues (e.g. missing connection targets).
   * @param {Object} scene
   */
  showGraphIssues(scene) {
    const graph = scene.graph;
    const missing = [];
    graph.nodes.forEach((node) => {
      (node.nextNodeIds || []).forEach((nextId) => {
        if (nextId && !graph.getNode(nextId)) {
          missing.push(`${node.id}->${nextId}`);
        }
      });
    });
    const hash = missing.sort().join("|");
    if (hash === this.lastGraphIssuesHash) {
      return;
    }
    this.lastGraphIssuesHash = hash;
    if (missing.length > 0) {
      showInfo(
        `El grafo tiene ${missing.length} conexión(es) a nodos inexistentes.`,
        4000
      );
    }
  }

  /**
   * Sets the selected node ID.
   * @param {string|null} nodeId
   */
  setSelectedNodeId(nodeId) {
    this.selectedNodeId = nodeId;
  }

  /**
   * Sets multiple selected node IDs.
   * @param {Set|Array} nodeIds
   */
  setSelectedNodeIds(nodeIds) {
    this.selectedNodeIds = nodeIds instanceof Set ? nodeIds : new Set(nodeIds);
    // Mantener compatibilidad: usa el primero como seleccionado principal
    const first = this.selectedNodeIds.values().next().value;
    this.selectedNodeId = first || null;
  }

  /**
   * Enables or disables drag.
   * @param {boolean} enabled
   */
  setDragEnabled(enabled) {
    this.dragEnabled = !!enabled;
  }

  /**
   * Sets selected edge.
   * @param {Object|null} edge
   */
  setSelectedEdge(edge) {
    this.selectedEdge = edge; // { sourceId, targetId } or null
  }

  /**
   * Sets search matches to highlight.
   * @param {Set} matchesSet
   */
  setSearchMatches(matchesSet) {
    this.searchMatches = matchesSet || new Set();
  }

  /**
   * Requests an auto-layout on next render.
   */
  requestAutoLayout() {
    this.autoLayoutRequested = true;
  }

  /**
   * Determines if auto-layout should be performed.
   * @param {Object} scene
   * @returns {boolean}
   */
  shouldAutoLayout(scene) {
    if (this.autoLayoutRequested) return true;
    const nodes = Array.from(scene.graph.nodes.values());
    if (nodes.length === 0) return false;
    // Si algún nodo no tiene posición, forzar autolayout inicial
    return nodes.some(
      (n) =>
        n.x === undefined ||
        n.y === undefined ||
        n.x === null ||
        n.y === null ||
        Number.isNaN(n.x) ||
        Number.isNaN(n.y)
    );
  }

  /**
   * Computes the required height for the graph container.
   * @param {Object} scene
   * @returns {number}
   */
  computeGraphHeight(scene) {
    let maxY = 0;
    scene.graph.nodes.forEach((node) => {
      const y = typeof node.y === "number" ? node.y : 0;
      if (y > maxY) {
        maxY = y;
      }
    });
    const estimatedNodeHeight = 100;
    const basePadding = 120;
    return Math.max(400, maxY + estimatedNodeHeight + basePadding);
  }

  /**
   * Computes start and end points for an edge.
   * @param {DOMRect} fromRect
   * @param {DOMRect} toRect
   * @param {DOMRect} containerRect
   * @returns {{x1: number, y1: number, x2: number, y2: number}}
   */
  computeEdgePoints(fromRect, toRect, containerRect) {
    const padding = 8;
    const fx = fromRect.left - containerRect.left + fromRect.width / 2;
    const fy = fromRect.top - containerRect.top + fromRect.height / 2;
    const tx = toRect.left - containerRect.left + toRect.width / 2;
    const ty = toRect.top - containerRect.top + toRect.height / 2;

    const dx = tx - fx;
    const dy = ty - fy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    const fromHalfW = fromRect.width / 2;
    const fromHalfH = fromRect.height / 2;
    const toHalfW = toRect.width / 2;
    const toHalfH = toRect.height / 2;

    // Evita dividir por cero cuando los nodos se solapan (dx y dy = 0)
    const denomFrom = Math.max(
      Math.abs(dx) / fromHalfW || 0,
      Math.abs(dy) / fromHalfH || 0
    );
    const denomTo = Math.max(
      Math.abs(dx) / toHalfW || 0,
      Math.abs(dy) / toHalfH || 0
    );
    const tFrom = denomFrom === 0 ? 0 : 1 / denomFrom;
    const tTo = denomTo === 0 ? 0 : 1 / denomTo;

    // Punto en el borde del nodo origen, luego empuja un poco hacia afuera
    let x1 = fx + dx * tFrom + ux * padding;
    let y1 = fy + dy * tFrom + uy * padding;

    // Punto en el borde del nodo destino, luego retrocede un poco para mostrar la punta
    const targetFactor = 1 - tTo;
    let x2 = fx + dx * targetFactor - ux * padding;
    let y2 = fy + dy * targetFactor - uy * padding;

    return { x1, y1, x2, y2 };
  }

  /**
   * Redraws edges (used during drag).
   */
  redrawEdges() {
    const svg = this.lastSvg;
    const container = this.lastNodesContainer;
    const scene = this.projectStore?.currentScene || this.lastScene;
    if (!svg || !container || !scene) return;
    this.drawEdges(svg, container, scene);
  }

  /**
   * Starts drag operation for nodes.
   * @param {Event} event
   * @param {Object} node
   * @param {HTMLElement} nodeEl
   * @param {HTMLElement} container
   * @param {HTMLElement} scrollParent
   */
  startDrag(event, node, nodeEl, container, scrollParent) {
    const scrollRect = scrollParent.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();
    const offsetX = event.clientX - nodeRect.left;
    const offsetY = event.clientY - nodeRect.top;
    const snapSize = 8;
    const centerX =
      (scrollParent?.clientWidth || 0) / 2 || this.currentCenterX || 0;

    const scene = this.projectStore.currentScene;
    if (!scene || !scene.graph) return;

    // Determina el conjunto de nodos a mover (los seleccionados, o solo este)
    const selectedSet = new Set(this.selectedNodeIds || []);
    if (!selectedSet.has(node.id)) {
      selectedSet.clear();
      selectedSet.add(node.id);
      if (this.onNodeSelect) {
        this.onNodeSelect(node.id);
      }
    }
    const nodesToMove = Array.from(selectedSet);

    const initialPositions = new Map();
    nodesToMove.forEach((id) => {
      const n = scene.graph.getNode(id);
      if (!n) return;
      initialPositions.set(id, {
        x: typeof n.x === "number" ? n.x : 0,
        y: typeof n.y === "number" ? n.y : 0,
      });
    });

    const startX = typeof node.x === "number" ? node.x : 0;
    const startY = typeof node.y === "number" ? node.y : 0;
    let lastX = startX;
    let lastY = startY;
    const newPositions = new Map();
    let moved = false;

    const onMove = (e) => {
      const newX =
        e.clientX - scrollRect.left + scrollParent.scrollLeft - offsetX;
      const newY =
        e.clientY - scrollRect.top + scrollParent.scrollTop - offsetY;
      const snap = e.ctrlKey;
      const centeredRawX = Math.round(newX - centerX);
      const rawY = Math.round(newY);

      if (snap) {
        const deltaX = centeredRawX - startX;
        const deltaY = rawY - startY;
        const snappedDeltaX = Math.round(deltaX / snapSize) * snapSize;
        const snappedDeltaY = Math.round(deltaY / snapSize) * snapSize;
        lastX = startX + snappedDeltaX;
        lastY = Math.max(0, startY + snappedDeltaY);
      } else {
        lastX = centeredRawX;
        lastY = Math.max(0, rawY);
      }

      const deltaXAll = lastX - startX;
      const deltaYAll = lastY - startY;

      nodesToMove.forEach((id) => {
        const base = initialPositions.get(id);
        if (!base) return;
        const targetX = base.x + deltaXAll;
        const targetY = Math.max(0, base.y + deltaYAll);
        newPositions.set(id, { x: targetX, y: targetY });
        const el = container.querySelector(`.node-card[data-node-id="${id}"]`);
        if (el) {
          el.style.left = `${centerX + targetX}px`;
          el.style.top = `${targetY}px`;
        }
      });

      moved = true;
      // Redibuja flechas en tiempo real mientras se arrastra
      this.redrawEdges();
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (!moved) return;
      if (lastX === startX && lastY === startY) return;
      const scene = this.projectStore.currentScene;
      if (!scene) return;
      const moves = [];
      newPositions.forEach((pos, id) => {
        const initial = initialPositions.get(id);
        if (!initial) return;
        if (initial.x === pos.x && initial.y === pos.y) return;
        moves.push({
          id,
          fromX: initial.x,
          fromY: initial.y,
          toX: pos.x,
          toY: pos.y,
        });
      });
      if (!moves.length) return;
      const cmd = new MoveNodesCommand(scene, moves);
      this.projectStore.executeCommand(cmd);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }
}
