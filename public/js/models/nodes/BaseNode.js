/**
 * BaseNode.js
 * Base class for all graph nodes, defining common properties.
 */
import { generateId } from "../../utils/idGenerator.js";
/**
 * Base class for all graph nodes.
 */
export class BaseNode {
  /**
   * @param {Object} data - Node data.
   * @param {string} data.id - Node ID.
   * @param {string} data.type - Node type.
   * @param {string} [data.name] - Node name.
   * @param {number} [data.x] - X position.
   * @param {number} [data.y] - Y position.
   * @param {Array} [data.nextNodeIds] - List of next node IDs.
   */
  constructor({ id, type, name, x, y, nextNodeIds }) {
    this.id = id;
    this.type = type;
    this.name = name || type;
    this.x = typeof x === "number" ? x : 50;
    this.y = typeof y === "number" ? y : 50;
    this.nextNodeIds = nextNodeIds || [];
  }
}
