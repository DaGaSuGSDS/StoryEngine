import { Command } from "./Command.js";

export class AddNodeCommand extends Command {
  constructor(scene, node) {
    super();
    this.scene = scene;
    this.node = node;
  }

  execute() {
    this.scene.graph.addNode(this.node);
    return true;
  }

  undo() {
    this.scene.graph.removeNode(this.node.id);

    if (this.scene.graph.startNodeId === this.node.id) {
      this.scene.graph.startNodeId = null;
    }

    return true;
  }

  description() {
    return `Agregar nodo: ${this.node.name}`;
  }
}
