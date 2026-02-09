import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class OperationNode extends BaseNode {
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
