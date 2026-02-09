import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class FlagTestNode extends BaseNode {
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
