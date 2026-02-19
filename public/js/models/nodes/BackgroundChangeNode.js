/**
 * BackgroundChangeNode.js
 * Node representing a change in the background image.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for changing the scene background.
 */
export class BackgroundChangeNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {string} [data.imageId] - Background image ID.
   * @param {number} [data.fadeDuration] - Fade duration in ms.
   */
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

