import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class SetCharacterStateNode extends BaseNode {
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

