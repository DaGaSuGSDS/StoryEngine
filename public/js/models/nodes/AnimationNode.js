/**
 * AnimationNode.js
 * Node representing an animation event.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for playing character animations.
 */
export class AnimationNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {string} [data.animationType] - Type of animation.
   * @param {string|Object} [data.effect] - Visual effect.
   * @param {string} [data.characterId] - Character ID.
   * @param {Array} [data.animations] - List of animations.
   */
  constructor({
    id,
    name,
    x,
    y,
    nextNodeIds,
    animationType,
    effect,
    characterId,
    animations,
  }) {
    super({
      id,
      type: NODE_TYPES.ANIMATION,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.animationType = animationType || null;
    this.effect = effect || "";
    this.characterId = characterId || null;
    if (Array.isArray(animations) && animations.length > 0) {
      this.animations = animations;
    } else if (animationType) {
      const duration =
        effect && typeof effect === "object" && effect.duration != null
          ? effect.duration
          : 800;
      this.animations = [
        {
          type: animationType,
          characterId: characterId || null,
          duration,
        },
      ];
    } else {
      this.animations = [];
    }
  }
}
