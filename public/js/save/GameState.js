/**
 * GameState - Representa el estado completo del juego en un momento dado
 * Esta clase maneja la serialización y deserialización del estado para guardado/cargado
 */
export class GameState {
  constructor({
    version = "1.0",
    projectId = null,
    currentSceneId = null,
    currentNodeId = null,
    flags = [],
    characterVariables = {},
    backgroundImageId = null,
    characterVisuals = {},
    timestamp = Date.now(),
    playTime = 0,
    scenePreview = "",
    slotNumber = null,
    dialogueHistory = null,
  } = {}) {
    this.version = version;
    this.projectId = projectId;
    this.currentSceneId = currentSceneId;
    this.currentNodeId = currentNodeId;
    this.flags = flags;
    this.characterVariables = characterVariables;
    this.backgroundImageId = backgroundImageId;
    this.characterVisuals = characterVisuals;
    this.timestamp = timestamp;
    this.playTime = playTime;
    this.scenePreview = scenePreview;
    this.slotNumber = slotNumber;
    this.dialogueHistory = dialogueHistory;
  }

  /**
   * Serializa el estado a un objeto JSON
   */
  toJSON() {
    return {
      version: this.version,
      projectId: this.projectId,
      currentSceneId: this.currentSceneId,
      currentNodeId: this.currentNodeId,
      flags: this.flags,
      characterVariables: this.characterVariables,
      backgroundImageId: this.backgroundImageId,
      characterVisuals: this.characterVisuals,
      timestamp: this.timestamp,
      playTime: this.playTime,
      scenePreview: this.scenePreview,
      slotNumber: this.slotNumber,
      dialogueHistory: this.dialogueHistory,
    };
  }

  /**
   * Crea una instancia de GameState desde un objeto JSON
   */
  static fromJSON(json) {
    if (!json || typeof json !== "object") {
      throw new Error("Invalid JSON data for GameState");
    }

    if (json.version !== "1.0") {
      console.warn(
        `GameState version mismatch: expected 1.0, got ${json.version}`
      );
    }

    return new GameState(json);
  }

  /**
   * Valida que el estado sea válido
   */
  isValid() {
    return !!(
      this.projectId &&
      this.currentSceneId &&
      this.currentNodeId &&
      this.version
    );
  }

  /**
   * Obtiene una descripción legible del guardado para mostrar en la UI
   */
  getDisplayInfo() {
    const date = new Date(this.timestamp);
    const hours = Math.floor(this.playTime / 3600);
    const minutes = Math.floor((this.playTime % 3600) / 60);

    return {
      slotNumber: this.slotNumber,
      scenePreview: this.scenePreview || "Sin título",
      date: date.toLocaleString(),
      playTime: `${hours}h ${minutes}m`,
      timestamp: this.timestamp,
    };
  }
}
