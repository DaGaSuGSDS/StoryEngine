/**
 * SetCharacterStateNode.js
 * Node for updating the visual state of character(s).
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node to set multiple character states/expressions at once.
 */
export class SetCharacterStateNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {Array} [data.changes] - List of state changes.
   */
  constructor({ id, name, x, y, nextNodeIds, changes }) {
    super({
      id,
      type: NODE_TYPES.SET_CHARACTER_STATE,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.changes = Array.isArray(changes) ? changes : [];
  }
}

