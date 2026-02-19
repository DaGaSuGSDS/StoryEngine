/**
 * WaitNode.js
 * Node representing a delay or pause in execution.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node that pauses execution for a set time.
 */
export class WaitNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {number} [data.duration] - Duration in ms.
   */
  constructor({ id, name, x, y, nextNodeIds, duration }) {
    super({
      id,
      type: NODE_TYPES.WAIT,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.duration =
      typeof duration === "number" && !Number.isNaN(duration)
        ? duration
        : 500;
  }
}

