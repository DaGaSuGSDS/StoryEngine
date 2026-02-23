/**
 * nodeTypes.js
 * Definitions of node types and helper functions for node classification.
 */
/**
 * Enum of all available node types.
 */
export const NODE_TYPES = {
  DIALOGUE: "dialogue",
  PLAYER_OPTIONS: "playerOptions",
  ANIMATION: "animation",
  AUDIO: "audio",
  WAIT: "wait",
  BACKGROUND_CHANGE: "backgroundChange",
  SET_CHARACTER_STATE: "setCharacterState",
  RANDOM: "random",
  SET_FLAG: "setFlag",
  OPERATION: "operation",
  CONDITIONAL: "conditional",
  FLAG_TEST: "flagTest",
  SCENE_CHANGE: "sceneChange",
  BASE: "base",
};

/**
 * Order of node types for UI display or processing.
 */
export const ORDERED_NODE_TYPES = [
  NODE_TYPES.DIALOGUE,
  NODE_TYPES.PLAYER_OPTIONS,
  NODE_TYPES.ANIMATION,
  NODE_TYPES.AUDIO,
  NODE_TYPES.WAIT,
  NODE_TYPES.BACKGROUND_CHANGE,
  NODE_TYPES.SET_CHARACTER_STATE,
  NODE_TYPES.RANDOM,
  NODE_TYPES.SET_FLAG,
  NODE_TYPES.OPERATION,
  NODE_TYPES.CONDITIONAL,
  NODE_TYPES.FLAG_TEST,
  NODE_TYPES.SCENE_CHANGE,
];

/**
 * Checks if a node type is considered a "logic" node.
 * @param {string} type - Node type.
 * @returns {boolean} True if logic node.
 */
export function isLogicNodeType(type) {
  return (
    type === NODE_TYPES.SET_FLAG ||
    type === NODE_TYPES.OPERATION ||
    type === NODE_TYPES.CONDITIONAL ||
    type === NODE_TYPES.FLAG_TEST ||
    type === NODE_TYPES.SCENE_CHANGE ||
    type === NODE_TYPES.WAIT ||
    type === NODE_TYPES.RANDOM ||
    type === NODE_TYPES.AUDIO ||
    type === NODE_TYPES.BACKGROUND_CHANGE ||
    type === NODE_TYPES.SET_CHARACTER_STATE
  );
}

/**
 * Gets the maximum number of output connections for a node type.
 * @param {string} type - Node type.
 * @returns {number} Max outputs (Infinity for unlimited).
 */
export function getMaxOutputs(type) {
  switch (type) {
    case NODE_TYPES.PLAYER_OPTIONS:
    case NODE_TYPES.RANDOM:
      return Infinity;
    case NODE_TYPES.CONDITIONAL:
    case NODE_TYPES.FLAG_TEST:
      return 2;
    case NODE_TYPES.SCENE_CHANGE:
      return 0;
    default:
      return 1;
  }
}
