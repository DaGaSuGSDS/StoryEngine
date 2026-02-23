/**
 * GraphLayout.js
 * Utility for automatic graph node layouting.
 */
import { GRID_SIZE } from "../ui/tabs/graphEditor/constants.js";
/**
 * Computes an automatic layout for the graph nodes using a layered approach.
 * 
 * Algorithm overview:
 * 1. BFS traversal to assign "levels" (depth) to each node starting from the startNode.
 * 2. Iterative refinement to minimize edge crossing and respect directionality.
 * 3. Positioning nodes in a grid-like structure based on their level and order.
 * 
 * @param {Graph} graph - The graph model containing nodes.
 * @param {number} width - (Unused) Available width, kept for signature compatibility.
 * @returns {number|null} The calculated height of the graph, or null if empty.
 */
export function autoLayoutGraph(graph, width) {
  const nodes = Array.from(graph.nodes.values());
  if (nodes.length === 0) {
    return null;
  }

  // Map of NodeID -> Level (Depth)
  const levels = new Map();
  const visited = new Set();
  const queue = [];

  const firstNode = nodes[0];
  const startId = graph.startNodeId || (firstNode && firstNode.id);
  const startNode = startId ? graph.getNode(startId) : null;

  if (startNode) {
    levels.set(startNode.id, 0);
    visited.add(startNode.id);
    queue.push(startNode);
  }

  // 1. BFS Traversal to establish initial levels (Assign levels based on distance from start)
  while (queue.length > 0) {
    const node = queue.shift();
    const level = levels.get(node.id) || 0;
    (node.nextNodeIds || []).forEach((nextId) => {
      const next = graph.getNode(nextId);
      if (next && !visited.has(next.id)) {
        visited.add(next.id);
        levels.set(next.id, level + 1);
        queue.push(next);
      }
    });
  }

  // Collect all edges for the refinement step
  const edges = [];
  graph.nodes.forEach((node) => {
    (node.nextNodeIds || []).forEach((nextId) => {
      if (graph.getNode(nextId)) {
        edges.push([node.id, nextId]);
      }
    });
  });

  // 2. Iterative Refinement
  // Push nodes down if they have parents at deeper levels to ensure consistent flow.
  // This helps when there are back-edges or complex branching.
  const maxIterations = nodes.length * 2;
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    for (const [fromId, toId] of edges) {
      const fromLevel = levels.get(fromId);
      if (fromLevel == null) continue;
      const currentTo = levels.get(toId) ?? 0;
      const desired = fromLevel + 1;
      // If the target node is 'above' or at the same level as the source, push it down
      if (desired > currentTo) {
        levels.set(toId, desired);
        changed = true;
      }
    }
    if (!changed) break; // Optimization: Stop if no changes occurred in this pass
  }

  let maxLevel = 0;
  levels.forEach((lvl) => {
    if (lvl > maxLevel) maxLevel = lvl;
  });
  const defaultLevel = maxLevel + 1;

  nodes.forEach((node) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, defaultLevel);
    }
  });

  // Group nodes by their assigned level
  const byLevel = new Map();
  levels.forEach((lvl, nodeId) => {
    const node = graph.getNode(nodeId);
    if (!node) return;
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl).push(node);
  });

  const verticalSpacing = 140;
  const baseTop = 40;
  const horizontalSpacing = 220;
  const nodeWidth = 220;
  const centerX = 0; // origen en el centro lógico; se traslada en render

  // 3. Coordinate Assignment
  // Calculate final X, Y coordinates based on level and index within the level.
  let maxUsedLevel = 0;
  byLevel.forEach((nodesAtLevel, lvl) => {
    // Sort nodes within the same level to minimize crossing (simple heuristic based on current X or ID)
    nodesAtLevel.sort((a, b) => {
      const ax = typeof a.x === "number" ? a.x : 0;
      const bx = typeof b.x === "number" ? b.x : 0;
      if (ax !== bx) return ax - bx;
      return (a.id || "").localeCompare(b.id || "");
    });

    // Center the row of nodes
    const count = nodesAtLevel.length;
    const totalWidth = (count - 1) * horizontalSpacing;
    const startCenterX = centerX - totalWidth / 2;

    nodesAtLevel.forEach((node, index) => {
      const nodeCenterX = startCenterX + index * horizontalSpacing;
      // Save X relative to the center line
      node.x = Math.round(nodeCenterX - centerX - nodeWidth / 2);
      node.y = baseTop + lvl * verticalSpacing;
    });
    if (lvl > maxUsedLevel) maxUsedLevel = lvl;
  });

  const estimatedNodeHeight = 80;
  const graphHeight =
    baseTop + maxUsedLevel * verticalSpacing + estimatedNodeHeight;
  graph.originCentered = true;
  return graphHeight;
}
