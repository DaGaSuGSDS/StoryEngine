import { Component } from "../core/Component.js";
import { dom } from "../uiHelpers.js";

/**
 * Floating toolbar component for the Graph Editor.
 * Manages buttons for drag/drop, auto-layout, and search functionality.
 */
export class GraphToolbar extends Component {
    constructor(props = {}) {
        super(props);
        this.state = {
            expanded: false,
            dragEnabled: false,
            searchQuery: ""
        };

        // Callbacks provided by parent
        this.onToggleDrag = props.onToggleDrag || (() => { });
        this.onAutoLayout = props.onAutoLayout || (() => { });
        this.onSearch = props.onSearch || (() => { });
        this.onNextMatch = props.onNextMatch || (() => { });
        this.onClearSearch = props.onClearSearch || (() => { });
    }

    setDragEnabled(enabled) {
        this.state.dragEnabled = enabled;
        if (this.dragToggleBtn) {
            this.dragToggleBtn.textContent = enabled ? "Mover nodos: ON" : "Mover nodos: OFF";
            if (enabled) this.dragToggleBtn.classList.add("primary");
            else this.dragToggleBtn.classList.remove("primary");
        }
    }

    render() {
        this.toggleBtn = dom("button", {
            id: "graph-tools-toggle",
            class: "btn small graph-floating-toggle",
            onClick: () => this.togglePanel()
        }, ["▸ Herramientas"]);

        this.dragToggleBtn = dom("button", {
            id: "toggle-drag",
            class: "btn small",
            onClick: () => this.onToggleDrag()
        }, ["Mover nodos: OFF"]);

        this.autoLayoutBtn = dom("button", {
            id: "auto-layout",
            class: "btn small",
            onClick: () => this.onAutoLayout()
        }, ["Auto-ordenar"]);

        // Search UI
        this.searchInput = dom("input", {
            id: "graph-search",
            type: "text",
            placeholder: "Buscar nodo",
            class: "graph-search-input",
            onInput: (e) => this.onSearch(e.target.value),
            onKeydown: (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.onNextMatch();
                }
            },
            // Prevent click propagation
            onMousedown: (e) => e.stopPropagation(),
            onClick: (e) => e.stopPropagation()
        });

        this.toolbarBody = dom("div", {
            id: "graph-toolbar-body",
            class: "graph-floating-panel collapsed"
        }, [
            dom("div", { class: "graph-toolbar-left" }, [
                this.dragToggleBtn,
                this.autoLayoutBtn
            ]),
            dom("div", { class: "graph-toolbar-right" }, [
                this.searchInput,
                dom("button", {
                    id: "graph-search-next",
                    class: "btn small",
                    onClick: () => this.onNextMatch()
                }, ["Siguiente"]),
                dom("button", {
                    id: "graph-search-clear",
                    class: "btn small",
                    onClick: () => {
                        this.searchInput.value = "";
                        this.onClearSearch();
                    }
                }, ["Limpiar"])
            ])
        ]);

        const container = dom("div", { class: "graph-tools-floating" }, [
            this.toggleBtn,
            this.toolbarBody
        ]);

        return container;
    }

    togglePanel() {
        this.state.expanded = !this.state.expanded;
        if (this.state.expanded) {
            this.toggleBtn.textContent = "▾ Herramientas";
            this.toolbarBody.classList.remove("collapsed");
        } else {
            this.toggleBtn.textContent = "▸ Herramientas";
            this.toolbarBody.classList.add("collapsed");
        }
    }
}
