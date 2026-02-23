/**
 * SetFlagNode.js
 * Node for modifying boolean flags in the game state.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node to set a flag to true.
 */
export class SetFlagNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {string} [data.flagId] - Flag ID to set.
   */
  constructor({ id, name, x, y, nextNodeIds, flagId }) {
    super({
      id,
      type: NODE_TYPES.SET_FLAG,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.flagId = flagId || null;
  }
}
