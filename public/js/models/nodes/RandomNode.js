/**
 * RandomNode.js
 * Node for randomly selecting one of multiple output paths.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for selecting a random path.
 */
export class RandomNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   */
  constructor({ id, name, x, y, nextNodeIds }) {
    super({
      id,
      type: NODE_TYPES.RANDOM,
      name,
      x,
      y,
      nextNodeIds,
    });
  }
}

