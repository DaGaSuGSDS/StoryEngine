/**
 * DialogueNode.js
 * Node representing a dialogue event in the story.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for displaying dialogue.
 */
export class DialogueNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {string} [data.characterId] - Character speaking.
   * @param {string} [data.characterState] - Emotion/State of character.
   * @param {string} [data.text] - Dialogue text.
   * @param {string} [data.dialoguePosition] - Position of dialogue box.
   */
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
