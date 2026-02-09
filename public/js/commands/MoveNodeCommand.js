import { Command } from "./Command.js";

export class MoveNodeCommand extends Command {
  constructor(scene, nodeId, newX, newY) {
    super();
    this.scene = scene;
    this.nodeId = nodeId;
    this.newX = newX;
    this.newY = newY;
    this.oldX = null;
    this.oldY = null;
  }

  execute() {
    const node = this.scene.graph.getNode(this.nodeId);
    if (!node) {
      return false;
    }

    this.oldX = node.x;
    this.oldY = node.y;

    node.x = this.newX;
    node.y = this.newY;

    return true;
  }

  undo() {
    const node = this.scene.graph.getNode(this.nodeId);
    if (!node) {
      return false;
    }

    node.x = this.oldX;
    node.y = this.oldY;

    return true;
  }

  description() {
    return `Mover nodo a (${this.newX}, ${this.newY})`;
  }
}
