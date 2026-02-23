/**
 * nodeTypeConverter.js
 * Utilities for converting nodes between different types.
 */
import { NODE_TYPES } from "../../../models/nodes/nodeTypes.js";
import { DEFAULT_VALUES } from "./constants.js";

/**
 * Converts a node to a new type, preserving compatible properties.
 * @param {Object} node
 * @param {string} newType
 */
export function convertNodeType(node, newType) {
  const oldNext = Array.isArray(node.nextNodeIds)
    ? node.nextNodeIds.slice()
    : [];
  node.type = newType;

  const setSingleNext = () => {
    node.nextNodeIds = oldNext.length ? [oldNext[0]] : [];
  };

  const setDualNext = () => {
    node.nextNodeIds = [oldNext[0] || null, oldNext[1] || null];
  };

  switch (newType) {
    case NODE_TYPES.DIALOGUE: {
      node.characterId = node.characterId || null;
      node.characterState = node.characterState || "";
      node.text = node.text || "";
      setSingleNext();
      break;
    }
    case NODE_TYPES.ANIMATION: {
      node.animationType = node.animationType || "fade";
      node.effect = node.effect || "";
      node.characterId = node.characterId || null;
      setSingleNext();
      break;
    }
    case NODE_TYPES.SET_FLAG: {
      node.flagId = node.flagId || null;
      setSingleNext();
      break;
    }
    case NODE_TYPES.OPERATION: {
      node.characterId = node.characterId || null;
      node.variableName = node.variableName || "";
      node.operation = node.operation || "+";
      node.value = typeof node.value === "number" ? node.value : 0;
      setSingleNext();
      break;
    }
    case NODE_TYPES.CONDITIONAL: {
      node.characterIds = node.characterIds || [null, null];
      if (node.characterIds.length < 2) {
        node.characterIds[1] = node.characterIds[1] || null;
      }
      node.character1Variable = node.character1Variable || "";
      node.condition = node.condition || "==";
      node.compareType = node.compareType || "value";
      node.value = typeof node.value === "number" ? node.value : 0;
      node.character2Variable = node.character2Variable || "";
      setDualNext();
      break;
    }
    case NODE_TYPES.FLAG_TEST: {
      node.flagId = node.flagId || null;
      setDualNext();
      break;
    }
    case NODE_TYPES.PLAYER_OPTIONS: {
      const firstNext = oldNext[0] || null;
      if (!Array.isArray(node.options)) {
        node.options = [];
      }
      if (!Array.isArray(node.nextNodeIds)) {
        node.nextNodeIds = [];
      }
      if (!node.options.length) {
        node.options = ["Opción 1"];
        node.nextNodeIds = [firstNext];
      } else if (node.options.length !== node.nextNodeIds.length) {
        node.nextNodeIds = node.options.map(
          (_, idx) => node.nextNodeIds[idx] || null
        );
      }
      break;
    }
    case NODE_TYPES.SCENE_CHANGE: {
      node.targetSceneId = node.targetSceneId || null;
      node.nextNodeIds = [];
      break;
    }
    case NODE_TYPES.AUDIO: {
      node.audioId = node.audioId || null;
      node.action = node.action || "play";
      node.loop = !!node.loop;
      node.volume =
        typeof node.volume === "number" && !Number.isNaN(node.volume)
          ? node.volume
          : DEFAULT_VALUES.VOLUME;
      setSingleNext();
      break;
    }
    case NODE_TYPES.WAIT: {
      node.duration =
        typeof node.duration === "number" && !Number.isNaN(node.duration)
          ? node.duration
          : DEFAULT_VALUES.WAIT_DURATION;
      setSingleNext();
      break;
    }
    case NODE_TYPES.BACKGROUND_CHANGE: {
      node.imageId = node.imageId || null;
      node.fadeDuration =
        typeof node.fadeDuration === "number" &&
          !Number.isNaN(node.fadeDuration)
          ? node.fadeDuration
          : DEFAULT_VALUES.FADE_DURATION;
      setSingleNext();
      break;
    }
    case NODE_TYPES.SET_CHARACTER_STATE: {
      if (!Array.isArray(node.changes)) {
        node.changes = [];
      }
      setSingleNext();
      break;
    }
    case NODE_TYPES.RANDOM: {
      if (!Array.isArray(node.nextNodeIds)) {
        node.nextNodeIds = [];
      }
      if (!node.nextNodeIds.length && oldNext.length) {
        node.nextNodeIds = [oldNext[0]];
      }
      break;
    }
    default: {
      setSingleNext();
    }
  }
}
