import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class WaitNode extends BaseNode {
  constructor({ id, name, x, y, nextNodeIds, duration }) {
    super({
      id,
      type: NODE_TYPES.WAIT,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.duration =
      typeof duration === "number" && !Number.isNaN(duration)
        ? duration
        : 500;
  }
}

