import { Graph } from "./Graph.js";

export class Scene {
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

  static fromRaw(raw) {
    return new Scene({
      id: raw.id,
      name: raw.name,
      characterIds: raw.characterIds || [],
      backgroundImageId: raw.backgroundImageId || null,
      graph: Graph.fromRaw(raw.graph || {}),
    });
  }

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

