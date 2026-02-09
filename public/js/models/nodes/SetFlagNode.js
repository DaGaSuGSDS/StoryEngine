import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class SetFlagNode extends BaseNode {
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
