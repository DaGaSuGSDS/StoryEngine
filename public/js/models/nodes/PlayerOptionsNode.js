/**
 * PlayerOptionsNode.js
 * Node representing a branching point where the player chooses an option.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for presenting simple options to the player.
 */
export class PlayerOptionsNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {Array} [data.options] - List of options.
   */
  constructor({ id, name, x, y, nextNodeIds, options }) {
    super({
      id,
      type: NODE_TYPES.PLAYER_OPTIONS,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.options = options || [];
  }
}
