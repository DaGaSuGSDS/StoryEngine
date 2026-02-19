/**
 * AudioNode.js
 * Node representing an audio playback event.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for playing or stopping audio.
 */
export class AudioNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {string} [data.audioId] - Audio asset ID.
   * @param {string} [data.action] - "play" or "stop".
   * @param {boolean} [data.loop] - Whether to loop.
   * @param {number} [data.volume] - Volume (0-1).
   */
  constructor({
    id,
    name,
    x,
    y,
    nextNodeIds,
    audioId,
    action,
    loop,
    volume,
  }) {
    super({
      id,
      type: NODE_TYPES.AUDIO,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.audioId = audioId || null;
    this.action = action || "play";
    this.loop = !!loop;
    this.volume =
      typeof volume === "number" && !Number.isNaN(volume)
        ? volume
        : 1;
  }
}

