import { Command } from "./Command.js";

export class UpdateNodeCommand extends Command {
  constructor(scene, nodeId, updates) {
    super();
    this.scene = scene;
    this.nodeId = nodeId;
    this.updates = updates;
    this.previousValues = {};
  }

  execute() {
    const node = this.scene.graph.getNode(this.nodeId);
    if (!node) {
      return false;
    }

    Object.keys(this.updates).forEach((key) => {
      this.previousValues[key] = node[key];
    });

    Object.assign(node, this.updates);

    return true;
  }

  undo() {
    const node = this.scene.graph.getNode(this.nodeId);
    if (!node) {
      return false;
    }

    Object.assign(node, this.previousValues);

    return true;
  }

  description() {
    const keys = Object.keys(this.updates).join(", ");
    return `Actualizar nodo: ${keys}`;
  }
}
