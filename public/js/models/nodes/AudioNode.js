import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class AudioNode extends BaseNode {
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

