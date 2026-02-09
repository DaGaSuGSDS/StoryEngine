export function autoLayoutGraph(graph, width) {
  const nodes = Array.from(graph.nodes.values());
  if (nodes.length === 0) {
    return null;
  }

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

  const edges = [];
  graph.nodes.forEach((node) => {
    (node.nextNodeIds || []).forEach((nextId) => {
      if (graph.getNode(nextId)) {
        edges.push([node.id, nextId]);
      }
    });
  });

  const maxIterations = nodes.length * 2;
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    for (const [fromId, toId] of edges) {
      const fromLevel = levels.get(fromId);
      if (fromLevel == null) continue;
      const currentTo = levels.get(toId) ?? 0;
      const desired = fromLevel + 1;
      if (desired > currentTo) {
        levels.set(toId, desired);
        changed = true;
      }
    }
    if (!changed) break;
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

  let maxUsedLevel = 0;
  byLevel.forEach((nodesAtLevel, lvl) => {
    nodesAtLevel.sort((a, b) => {
      const ax = typeof a.x === "number" ? a.x : 0;
      const bx = typeof b.x === "number" ? b.x : 0;
      if (ax !== bx) return ax - bx;
      return (a.id || "").localeCompare(b.id || "");
    });
    const count = nodesAtLevel.length;
    const totalWidth = (count - 1) * horizontalSpacing;
    const startCenterX = centerX - totalWidth / 2;
    nodesAtLevel.forEach((node, index) => {
      const nodeCenterX = startCenterX + index * horizontalSpacing;
      // Guardar coordenada X relativa a la línea central
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
