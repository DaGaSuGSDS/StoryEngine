/**
 * SceneChangeNode.js
 * Node representing a transition to another scene.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for changing to another scene.
 */
export class SceneChangeNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {string} [data.targetSceneId] - ID of target scene.
   */
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
