import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class BackgroundChangeNode extends BaseNode {
  constructor({
    id,
    name,
    x,
    y,
    nextNodeIds,
    imageId,
    fadeDuration,
  }) {
    super({
      id,
      type: NODE_TYPES.BACKGROUND_CHANGE,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.imageId = imageId || null;
    this.fadeDuration =
      typeof fadeDuration === "number" && !Number.isNaN(fadeDuration)
        ? fadeDuration
        : 0;
  }
}

