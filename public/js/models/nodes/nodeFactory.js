/**
 * nodeFactory.js
 * Factory functions for creating and serializing node instances.
 */
import { BaseNode } from "./BaseNode.js";
import { AnimationNode } from "./AnimationNode.js";
import { DialogueNode } from "./DialogueNode.js";
import { PlayerOptionsNode } from "./PlayerOptionsNode.js";
import { SetFlagNode } from "./SetFlagNode.js";
import { OperationNode } from "./OperationNode.js";
import { ConditionalNode } from "./ConditionalNode.js";
import { FlagTestNode } from "./FlagTestNode.js";
import { SceneChangeNode } from "./SceneChangeNode.js";
import { AudioNode } from "./AudioNode.js";
import { WaitNode } from "./WaitNode.js";
import { BackgroundChangeNode } from "./BackgroundChangeNode.js";
import { SetCharacterStateNode } from "./SetCharacterStateNode.js";
import { RandomNode } from "./RandomNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Factory to create specific Node types from raw data.
 * @param {Object} raw - Raw node data.
 * @returns {BaseNode} Specific Node instance.
 */
export function createNodeFromRaw(raw) {
  const common = {
    id: raw.id,
    name: raw.name,
    x: raw.x,
    y: raw.y,
    nextNodeIds: raw.nextNodeIds || [],
  };
  switch (raw.type) {
    case NODE_TYPES.ANIMATION:
      return new AnimationNode({
        ...common,
        animationType: raw.animationType,
        effect: raw.effect,
        characterId: raw.characterId,
        animations: raw.animations || null,
      });
    case NODE_TYPES.DIALOGUE:
      return new DialogueNode({
        ...common,
        characterId: raw.characterId,
        characterState: raw.characterState,
        text: raw.text,
        dialoguePosition: raw.dialoguePosition,
      });
    case NODE_TYPES.PLAYER_OPTIONS:
      return new PlayerOptionsNode({
        ...common,
        options: raw.options || [],
      });
    case NODE_TYPES.AUDIO:
      return new AudioNode({
        ...common,
        audioId: raw.audioId,
        action: raw.action,
        loop: raw.loop,
        volume: raw.volume,
      });
    case NODE_TYPES.WAIT:
      return new WaitNode({
        ...common,
        duration: raw.duration,
      });
    case NODE_TYPES.BACKGROUND_CHANGE:
      return new BackgroundChangeNode({
        ...common,
        imageId: raw.imageId,
        fadeDuration: raw.fadeDuration,
      });
    case NODE_TYPES.SET_CHARACTER_STATE:
      return new SetCharacterStateNode({
        ...common,
        changes: raw.changes || [],
      });
    case NODE_TYPES.RANDOM:
      return new RandomNode({
        ...common,
      });
    case NODE_TYPES.SET_FLAG:
      return new SetFlagNode({
        ...common,
        flagId: raw.flagId,
      });
    case NODE_TYPES.OPERATION:
      return new OperationNode({
        ...common,
        characterId: raw.characterId,
        variableName: raw.variableName,
        operation: raw.operation,
        value: raw.value,
      });
    case NODE_TYPES.CONDITIONAL:
      return new ConditionalNode({
        ...common,
        characterIds: raw.characterIds || [null, null],
        character1Variable: raw.character1Variable,
        condition: raw.condition,
        compareType: raw.compareType,
        value: raw.value,
        character2Variable: raw.character2Variable,
      });
    case NODE_TYPES.FLAG_TEST:
      return new FlagTestNode({
        ...common,
        flagId: raw.flagId,
      });
    case NODE_TYPES.SCENE_CHANGE:
      return new SceneChangeNode({
        ...common,
        targetSceneId: raw.targetSceneId,
      });
    default:
      return new BaseNode({
        ...common,
        type: raw.type || NODE_TYPES.BASE,
      });
  }
}

/**
 * Serializes a Node instance to a raw object.
 * @param {BaseNode} node - Node instance.
 * @returns {Object} Raw node data.
 */
export function serializeNode(node) {
  const base = {
    id: node.id,
    type: node.type,
    name: node.name,
    x: node.x,
    y: node.y,
    nextNodeIds: node.nextNodeIds || [],
  };
  switch (node.type) {
    case NODE_TYPES.ANIMATION:
      return {
        ...base,
        animationType: node.animationType,
        effect: node.effect,
        characterId: node.characterId,
        animations: node.animations || null,
      };
    case NODE_TYPES.DIALOGUE:
      return {
        ...base,
        characterId: node.characterId,
        characterState: node.characterState,
        text: node.text,
        dialoguePosition: node.dialoguePosition || null,
      };
    case NODE_TYPES.PLAYER_OPTIONS:
      return {
        ...base,
        options: node.options || [],
      };
    case NODE_TYPES.AUDIO:
      return {
        ...base,
        audioId: node.audioId,
        action: node.action,
        loop: !!node.loop,
        volume: node.volume,
      };
    case NODE_TYPES.WAIT:
      return {
        ...base,
        duration: node.duration,
      };
    case NODE_TYPES.BACKGROUND_CHANGE:
      return {
        ...base,
        imageId: node.imageId,
        fadeDuration: node.fadeDuration,
      };
    case NODE_TYPES.SET_CHARACTER_STATE:
      return {
        ...base,
        changes: Array.isArray(node.changes) ? node.changes : [],
      };
    case NODE_TYPES.RANDOM:
      return {
        ...base,
      };
    case NODE_TYPES.SET_FLAG:
      return {
        ...base,
        flagId: node.flagId,
      };
    case NODE_TYPES.OPERATION:
      return {
        ...base,
        characterId: node.characterId,
        variableName: node.variableName,
        operation: node.operation,
        value: node.value,
      };
    case NODE_TYPES.CONDITIONAL:
      return {
        ...base,
        characterIds: node.characterIds || [null, null],
        character1Variable: node.character1Variable,
        condition: node.condition,
        compareType: node.compareType,
        value: node.value,
        character2Variable: node.character2Variable,
      };
    case NODE_TYPES.FLAG_TEST:
      return {
        ...base,
        flagId: node.flagId,
      };
    case NODE_TYPES.SCENE_CHANGE:
      return {
        ...base,
        targetSceneId: node.targetSceneId,
      };
    default:
      return base;
  }
}
