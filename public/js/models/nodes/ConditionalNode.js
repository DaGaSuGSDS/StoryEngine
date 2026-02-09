import { BaseNode } from "./BaseNode.js";
import { NODE_TYPES } from "./nodeTypes.js";

export class ConditionalNode extends BaseNode {
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
