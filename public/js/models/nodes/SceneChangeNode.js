import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class SceneChangeNode extends BaseNode {
  constructor({ id, name, x, y, nextNodeIds, targetSceneId }) {
    super({
      id,
      type: NODE_TYPES.SCENE_CHANGE,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.targetSceneId = targetSceneId || null;
  }
}
