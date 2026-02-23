/**
 * Scene.js
 * Model representing a story scene, containing a graph of nodes.
 */
import { generateId } from "../utils/idGenerator.js";
import { Graph } from "./Graph.js";

/**
 * Represents a scene in the project.
 */
export class Scene {
  /**
   * @param {Object} data - Scene data.
   * @param {string} data.id - Scene ID.
   * @param {string} data.name - Scene name.
   * @param {Array} [data.characterIds] - List of character IDs in the scene.
   * @param {string} [data.backgroundImageId] - Background image ID.
   * @param {Graph} [data.graph] - Scene graph.
   */
  constructor({
    id,
    name,
    characterIds,
    backgroundImageId,
    graph,
  }) {
    this.id = id;
    this.name = name;
    this.characterIds = characterIds || [];
    this.backgroundImageId = backgroundImageId || null;
    this.graph = graph || new Graph();
  }

  /**
   * Creates a Scene instance from raw data.
   * @param {Object} raw - Raw data.
   * @returns {Scene} Scene instance.
   */
  static fromRaw(raw) {
    return new Scene({
      id: raw.id,
      name: raw.name,
      characterIds: raw.characterIds || [],
      backgroundImageId: raw.backgroundImageId || null,
      graph: Graph.fromRaw(raw.graph || {}),
    });
  }

  /**
   * Converts the scene to a raw object.
   * @returns {Object} Raw data.
   */
  toRaw() {
    return {
      id: this.id,
      name: this.name,
      characterIds: this.characterIds,
      backgroundImageId: this.backgroundImageId,
      graph: this.graph.toRaw(),
    };
  }
}

