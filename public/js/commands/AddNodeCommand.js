/**
 * AddNodeCommand.js
 * Command to add a new node to the graph.
 */
import { Command } from "./Command.js";

/**
 * Command to add a node to the scene.
 */
export class AddNodeCommand extends Command {
  /**
   * @param {Scene} scene - Target scene.
   * @param {Object} node - Node instance.
   */
  constructor(scene, node) {
    super();
    this.scene = scene;
    this.node = node;
  }

  /**
   * Adds the node to the graph.
   */
  execute() {
    this.scene.graph.addNode(this.node);
    return true;
  }

  /**
   * Removes the node from the graph.
   */
  undo() {
    this.scene.graph.removeNode(this.node.id);

    if (this.scene.graph.startNodeId === this.node.id) {
      this.scene.graph.startNodeId = null;
    }

    return true;
  }

  /**
   * @returns {string} Description.
   */
  description() {
    return `Agregar nodo: ${this.node.name}`;
  }
}
