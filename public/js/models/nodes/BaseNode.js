export class BaseNode {
  constructor({ id, type, name, x, y, nextNodeIds }) {
    this.id = id;
    this.type = type;
    this.name = name || type;
    this.x = typeof x === "number" ? x : 50;
    this.y = typeof y === "number" ? y : 50;
    this.nextNodeIds = nextNodeIds || [];
  }
}
