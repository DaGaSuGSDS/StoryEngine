/**
 * Graph.js
 * Model representing the node graph structure of a scene.
 */
import { createNodeFromRaw, serializeNode } from "./nodes/nodeFactory.js";

/**
 * Represents the node graph of a scene.
 */
export class Graph {
  /**
   * Initializes a new Graph.
   */
  constructor() {
    this.nodes = new Map();
    this.startNodeId = null;
    this.originCentered = true;
  }

  /**
   * Creates a Graph instance from raw data.
   * @param {Object} raw - Raw data.
   * @returns {Graph} Graph instance.
   */
  static fromRaw(raw) {
    const g = new Graph();
    g.startNodeId = raw.startNodeId || null;
    // Si el flag es false explícito, necesitamos centrar; si falta, asumimos ya centrado
    const isCenteredFlag = raw.originCentered !== false;
    g.originCentered = isCenteredFlag;
    (raw.nodes || []).forEach((n) => {
      const node = createNodeFromRaw(n);
      g.nodes.set(node.id, node);
    });
    // Para grafos antiguos sin origen centrado, recentrar una sola vez
    if (!isCenteredFlag) {
      g.centerNodesAroundZero();
      g.originCentered = true;
    }
    return g;
  }

  /**
   * Converts the graph to a raw object.
   * @returns {Object} Raw data.
   */
  toRaw() {
    return {
      startNodeId: this.startNodeId,
      originCentered: this.originCentered,
      nodes: Array.from(this.nodes.values()).map((n) => serializeNode(n)),
    };
  }

  /**
   * Adds a node to the graph.
   * @param {Object} node - Node instance to add.
   */
  addNode(node) {
    this.nodes.set(node.id, node);
  }

  /**
   * Removes a node from the graph.
   * Also removes connections to this node from other nodes.
   * @param {string} nodeId - ID of the node to remove.
   */
  removeNode(nodeId) {
    this.nodes.delete(nodeId);
    for (const node of this.nodes.values()) {
      node.nextNodeIds = node.nextNodeIds.filter((id) => id !== nodeId);
    }
  }

  /**
   * Gets a node by ID.
   * @param {string} id - Node ID.
   * @returns {Object|null} Node instance or null.
   */
  getNode(id) {
    return this.nodes.get(id) || null;
  }

  /**
   * Recentra los nodos alrededor de x=0 usando su propio rango.
   */
  centerNodesAroundZero() {
    if (!this.nodes || this.nodes.size === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    this.nodes.forEach((node) => {
      const x = typeof node.x === "number" ? node.x : 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    });
    if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return;
    const center = (minX + maxX) / 2;
    if (Math.abs(center) < 0.5) return; // ya centrado
    this.nodes.forEach((node) => {
      const x = typeof node.x === "number" ? node.x : 0;
      node.x = x - center;
    });
  }
}
