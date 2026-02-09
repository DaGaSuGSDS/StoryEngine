import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class AnimationNode extends BaseNode {
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
