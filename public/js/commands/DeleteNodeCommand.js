import { Command } from "./Command.js";
import {
  serializeNode,
  createNodeFromRaw,
} from "../models/nodes/nodeFactory.js";

export class DeleteNodeCommand extends Command {
  constructor(scene, nodeId) {
    super();
    this.scene = scene;
    this.nodeId = nodeId;
    this.nodeSnapshot = null;
    this.wasStartNode = false;
    this.affectedConnections = [];
  }

  execute() {
    const node = this.scene.graph.getNode(this.nodeId);
    if (!node) {
      return false;
    }

    this.nodeSnapshot = serializeNode(node);
    this.wasStartNode = this.scene.graph.startNodeId === this.nodeId;

    this.affectedConnections = [];
    for (const otherNode of this.scene.graph.nodes.values()) {
      if (otherNode.nextNodeIds.includes(this.nodeId)) {
        this.affectedConnections.push({
          nodeId: otherNode.id,
          nextNodeIds: [...otherNode.nextNodeIds],
        });
      }
    }

    this.scene.graph.removeNode(this.nodeId);

    if (this.wasStartNode) {
      this.scene.graph.startNodeId = null;
    }

    return true;
  }

  undo() {
    if (!this.nodeSnapshot) {
      return false;
    }

    const node = createNodeFromRaw(this.nodeSnapshot);
    this.scene.graph.addNode(node);

    if (this.wasStartNode) {
      this.scene.graph.startNodeId = this.nodeId;
    }

    this.affectedConnections.forEach(({ nodeId, nextNodeIds }) => {
      const otherNode = this.scene.graph.getNode(nodeId);
      if (otherNode) {
        otherNode.nextNodeIds = nextNodeIds;
      }
    });

    return true;
  }

  description() {
    return `Eliminar nodo: ${this.nodeSnapshot?.name || this.nodeId}`;
  }
}
