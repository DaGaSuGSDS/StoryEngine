import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class DialogueNode extends BaseNode {
  constructor({
    id,
    name,
    x,
    y,
    nextNodeIds,
    characterId,
    characterState,
    text,
    dialoguePosition,
  }) {
    super({
      id,
      type: NODE_TYPES.DIALOGUE,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.characterId = characterId || null;
    this.characterState = characterState || "";
    this.text = text || "";
    this.dialoguePosition = dialoguePosition || "bottom";
  }
}
