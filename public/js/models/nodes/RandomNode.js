import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class RandomNode extends BaseNode {
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

