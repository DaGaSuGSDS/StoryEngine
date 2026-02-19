/**
 * MoveNodeCommand.js
 * Command to move a single node to a new position.
 */
import { Command } from "./Command.js";

/**
 * Command to move a single node.
 */
export class MoveNodeCommand extends Command {
  /**
   * @param {Scene} scene - Target scene.
   * @param {string} nodeId - ID of node to move.
   * @param {number} newX - New X position.
   * @param {number} newY - New Y position.
   */
  constructor(scene, nodeId, newX, newY) {
    super();
    this.scene = scene;
    this.nodeId = nodeId;
    this.newX = newX;
    this.newY = newY;
    this.oldX = null;
    this.oldY = null;
  }

  /**
   * Updates node position.
   */
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

  /**
   * Reverts node position.
   */
  undo() {
    const node = this.scene.graph.getNode(this.nodeId);
    if (!node) {
      return false;
    }

    node.x = this.oldX;
    node.y = this.oldY;

    return true;
  }

  /**
   * @returns {string} Description.
   */
  description() {
    return `Mover nodo a (${this.newX}, ${this.newY})`;
  }
}
