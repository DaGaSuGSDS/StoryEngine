import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class PlayerOptionsNode extends BaseNode {
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
