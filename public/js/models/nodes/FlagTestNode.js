/**
 * FlagTestNode.js
 * Node for branching based on boolean flag state.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for branching based on a flag value.
 */
export class FlagTestNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {string} [data.flagId] - Flag ID to test.
   */
  constructor({ id, name, x, y, nextNodeIds, flagId }) {
    super({
      id,
      type: NODE_TYPES.FLAG_TEST,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.flagId = flagId || null;
  }
}
