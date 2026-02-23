/**
 * ConditionalNode.js
 * Node for branching based on variable comparisons.
 */
import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

/**
 * Node for branching logic based on conditions.
 */
export class ConditionalNode extends BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {Array} [data.characterIds] - Involved character IDs.
   * @param {string} [data.character1Variable] - Left operand variable.
   * @param {string} [data.condition] - Operator (==, !=, >, <, etc).
   * @param {string} [data.compareType] - "value" or "variable".
   * @param {any} [data.value] - Right operand value.
   * @param {string} [data.character2Variable] - Right operand variable (if compareType is variable).
   */
  constructor({
    id,
    name,
    x,
    y,
    nextNodeIds,
    characterIds,
    character1Variable,
    condition,
    compareType,
    value,
    character2Variable,
  }) {
    super({
      id,
      type: NODE_TYPES.CONDITIONAL,
      name,
      x,
      y,
      nextNodeIds,
    });
    this.characterIds = characterIds || [null, null];
    this.character1Variable = character1Variable || "";
    this.condition = condition || "==";
    this.compareType = compareType || "value";
    this.value = typeof value === "number" ? value : 0;
    this.character2Variable = character2Variable || "";
  }
}
