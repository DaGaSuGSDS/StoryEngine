/**
 * OperationNode.js
 * Node for performing arithmetic operations on character variables.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for performing operations on variables.
 */
export class OperationNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {string} [data.characterId] - Character ID owning variable.
   * @param {string} [data.variableName] - Variable name.
   * @param {string} [data.operation] - Operation (=, +=, -=, etc).
   * @param {any} [data.value] - Value to operate with.
   */
  constructor({
    id,
    name,
    x,
    y,
    nextNodeIds,
    characterId,
    variableName,
    operation,
    value,
  }) {
    super({
      id,
      type: NODE_TYPES.OPERATION,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.characterId = characterId || null;
    this.variableName = variableName || "";
    this.operation = operation || "+";
    this.value = typeof value === "number" ? value : 0;
  }
}
