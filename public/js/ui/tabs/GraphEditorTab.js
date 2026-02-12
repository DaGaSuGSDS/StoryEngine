import { ScenePanel } from "./graphEditor/ScenePanel.js";
import { NodeRenderer } from "./graphEditor/NodeRenderer.js";
import { NodeInspector } from "./graphEditor/NodeInspector.js";
import { ContextMenuManager } from "./graphEditor/ContextMenuManager.js";
import { GraphToolbar } from "../graph/GraphToolbar.js";
import { GraphInteractionManager } from "../graph/GraphInteractionManager.js";

/**
 * Main controller for the Graph Editor tab.
 * Orchestrates:
 * - ScenePanel (Left)
 * - NodeInspector (Right)
 * - Toolbar (Top Floating)
 * - Canvas & NodeRenderer (Center)
 * - InteractionManager (Input handling)
 */
export class GraphEditorTab {
  constructor(projectStore) {
    this.projectStore = projectStore;
    this.root = null;
    this.dragEnabled = false; // Local state

    // --- Components Initialization ---

    this.scenePanel = new ScenePanel(
      projectStore,
      this.handleSceneSelect.bind(this)
    );

    // Context Menu (delegates actions to InteractionManager)
    this.contextMenuManager = new ContextMenuManager(
      projectStore,
      (id) => this.interactionManager?.setSelection([id]),
      (id) => this.interactionManager?.setSelection([id]),
      (id) => this.interactionManager?.deleteNode(), // On delete from context
      (ids) => {
        this.interactionManager?.setSelection(ids);
        this.interactionManager?.duplicateNode();
      },
      (ids) => {
        this.interactionManager?.setSelection(ids);
        this.interactionManager?.deleteNode();
      },
      () => this.interactionManager?.deleteNode()
    );

    // Interaction Manager (Selection, Keyboard, Marquee)
    this.interactionManager = new GraphInteractionManager(
      projectStore,
      this.contextMenuManager,
      {
        onSelectionChange: (ids) => {
          this.nodeRenderer.setSelectedNodeIds(ids);
          this.nodeInspector.refresh(this.interactionManager.selectedNodeId);
        },
        onRefresh: () => this.refresh()
      }
    );

    // Node Renderer
    this.nodeRenderer = new NodeRenderer(
      this.projectStore,
      (nodeId, event) =>
        this.interactionManager.handleNodeSelect(nodeId, event),
      (x, y, nodeId, selection) =>
        this.interactionManager.handleNodeContextMenu(
          x,
          y,
          nodeId,
          selection
        ),
      (nodeId, event) => this.interactionManager.startConnectionDrag(nodeId, event),
      (sourceId, targetId) => this.interactionManager.selectEdge(sourceId, targetId),
      (x, y, sourceId, targetId) => this.interactionManager.handleEdgeContextMenu(x, y, sourceId, targetId)
    ); // Node Inspector
    this.nodeInspector = new NodeInspector(projectStore);

    // Toolbar (UI)
    this.toolbar = new GraphToolbar({
      onToggleDrag: () => {
        this.dragEnabled = !this.dragEnabled;
        this.nodeRenderer.setDragEnabled(this.dragEnabled);
        this.toolbar.setDragEnabled(this.dragEnabled);
      },
      onAutoLayout: () => {
        this.nodeRenderer.requestAutoLayout();
        this.refresh();
      },
      onSearch: (query) => this.handleSearch(query),
      onNextMatch: () => this.handleNextMatch(),
      onClearSearch: () => this.handleClearSearch()
    });

    // Store subscription
    this.unsubscribe = this.projectStore.subscribe(() => this.refresh());

    // Search Local State
    this.searchQuery = "";
    this.searchMatches = [];
    this.searchIndex = -1;
    this.pendingScrollNodeId = null;

    this.resizeObserver = null;
    this.resizeTimeout = null;
  }

  render() {
    if (!this.unsubscribe) {
      this.unsubscribe = this.projectStore.subscribe(() => this.refresh());
    }

    this.root = document.createElement("div");
    Object.assign(this.root.style, {
      display: "flex",
      width: "100%",
      height: "100%",
      outline: "none"
    });
    this.root.tabIndex = 0;

    const leftPanel = this.scenePanel.render();
    const rightPanel = this.nodeInspector.render();

    // Center Panel Construction
    const center = document.createElement("div");
    center.className = "graph-center";

    // Mount Toolbar
    this.toolbar.mount(center);

    // Canvas
    const canvas = document.createElement("div");
    canvas.className = "graph-canvas";
    canvas.innerHTML = `<div class="graph-nodes-container" id="graph-nodes"></div>`;
    center.appendChild(canvas);

    this.root.appendChild(leftPanel);
    this.root.appendChild(center);
    this.root.appendChild(rightPanel);

    // Initialize logic
    this.setupResizeObserver(canvas);

    // Init Interaction Manager with DOM elements
    // Needs to wait for mount? No, elements exist.
    // InteractionManager uses root for keyboard shortcuts and canvas for marquee
    this.interactionManager.init(this.root, canvas);

    // Context menu on canvas background
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

    // Initial state sync
    this.toolbar.setDragEnabled(this.dragEnabled);
    this.refresh();

    setTimeout(() => {
      if (this.root) this.root.focus();
    }, 100);

    return this.root;
  }

  // --- Search Logic (Simplified) ---

  handleSearch(query) {
    this.searchQuery = query || "";
    this.searchIndex = -1;
    this.refresh();
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

  handleNextMatch() {
    if (!this.searchMatches.length) return;
    this.searchIndex = (this.searchIndex + 1) % this.searchMatches.length;
    const targetId = this.searchMatches[this.searchIndex];
    this.pendingScrollNodeId = targetId;
    this.interactionManager.setSelection([targetId]);
    this.refresh();
  }

  handleClearSearch() {
    this.searchQuery = "";
    this.searchMatches = [];
    this.searchIndex = -1;
    this.refresh();
  }

  // --- Scroll Logic ---

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

  // --- Panel/LifeCycle ---

  handleSceneSelect(nodeId) { // This is actually scene ID or StartNode Node ID?
    // In original code: handleSceneSelect(nodeId) -> setSelection([nodeId])
    // ScenePanel calls this when a node in the scene tree is clicked.
    if (nodeId) {
      this.interactionManager.setSelection([nodeId]);
    } else {
      this.interactionManager.clearSelection();
    }
    this.refresh();
  }

  refresh() {
    if (!this.root) return;

    this.scenePanel.refresh();

    // Toolbar updates if needed (e.g. if project loaded)
    // The Toolbar component mostly manages its own state, but visibility depends on project presence
    // Logic from original refreshToolbar:
    const hasProject = !!this.projectStore.project;
    const hasScene = hasProject && this.projectStore.scenes?.length > 0;
    const hasNodes = hasScene && this.projectStore.currentScene?.graph?.nodes?.size > 0;

    if (this.toolbar.element) {
      this.toolbar.element.style.display = (hasProject && hasScene && hasNodes) ? "flex" : "none";
    }

    this.updateSearchMatches();

    const container = this.root.querySelector("#graph-nodes");
    const scrollParent = this.root.querySelector(".graph-canvas");

    if (this.nodeRenderer) {
      this.nodeRenderer.setSelectedNodeIds(this.interactionManager.selectedNodeIds);
      this.nodeRenderer.setSearchMatches(this.interactionManager.searchMatches); // If this property existed directly or via getter
      // Pass selected edge
      this.nodeRenderer.setSelectedEdge(this.interactionManager.selectedEdge);
      this.nodeRenderer.render(container, scrollParent);
    }
    const primaryId = this.interactionManager.selectedNodeId;
    this.nodeInspector.refresh(primaryId);

    if (this.pendingScrollNodeId && scrollParent) {
      this.scrollToNode(this.pendingScrollNodeId, scrollParent);
      this.pendingScrollNodeId = null;
    }
  }

  setupResizeObserver(canvas) {
    if (!canvas || this.resizeObserver) return;
    if (typeof ResizeObserver === "undefined") {
      const handler = () => this.scheduleRefresh();
      window.addEventListener("resize", handler);
      // We don't have addManagedEventListener anymore helper here, 
      // should probably store it to remove.
      this.resizeHandler = handler;
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleRefresh();
    });
    this.resizeObserver.observe(canvas);
  }

  scheduleRefresh() {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.refresh(), 60);
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.interactionManager.destroy();
    this.contextMenuManager.destroy();
    this.toolbar.destroy();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }
}
