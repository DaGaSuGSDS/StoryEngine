/**
 * UpdateNodeCommand.js
 * Command to update the properties of a node.
 */
import { Command } from "./Command.js";

/**
 * Command to update properties of a node.
 */
export class UpdateNodeCommand extends Command {
  /**
   * @param {Scene} scene - Target scene.
   * @param {string} nodeId - ID of node to update.
   * @param {Object} updates - Object with properties to update.
   */
  constructor(scene, nodeId, updates) {
    super();
    this.scene = scene;
    this.nodeId = nodeId;
    this.updates = updates;
    this.previousValues = {};
  }

  /**
   * Applies updates to the node.
   */
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

  /**
   * Reverts updates.
   */
  undo() {
    const node = this.scene.graph.getNode(this.nodeId);
    if (!node) {
      return false;
    }

    Object.assign(node, this.previousValues);

    return true;
  }

  /**
   * @returns {string} Description.
   */
  description() {
    const keys = Object.keys(this.updates).join(", ");
    return `Actualizar nodo: ${keys}`;
  }
}
