/**
 * StoryEngine.js
 * Main controller for the game runtime, managing state, scenes, and saving/loading.
 */
import { ScenePlayer } from "./ScenePlayer.js";
import { DialogueHistory } from "./DialogueHistory.js";

export class StoryEngine {
  /**
   * @param {Object} projectStore
   * @param {Object} apiClient
   * @param {Object} options
   */
  constructor(projectStore, apiClient, options = {}) {
    this.projectStore = projectStore;
    this.apiClient = apiClient;
    this.player = null;
    this.containerElement = null;
    this.runtimeFlags = null;
    this.runtimeVariables = null;
    this.imageBaseUrlOverride = options.imageBaseUrl || null;
    this.audioBaseUrlOverride = options.audioBaseUrl || null;
    this.playTimeStart = null;
    this.totalPlayTime = 0;
    this.saveManager = null; // Inyectado desde game.js
    this.currentSaveSlot = null; // Slot seleccionado para autosave
  }

  /**
   * Stops the engine and optionally clears state.
   * @param {boolean} clearState
   */
  stop(clearState = true) {
    if (this.playTimeStart) {
      this.totalPlayTime += (Date.now() - this.playTimeStart) / 1000;
      this.playTimeStart = null;
    }

    if (this.player) {
      this.player.stop();
      this.player = null;
    }
    if (clearState) {
      this.runtimeFlags = null;
      this.runtimeVariables = null;
      this.totalPlayTime = 0;
    }
  }

  /**
   * Plays a specific scene.
   * @param {string} sceneId
   * @param {HTMLElement} containerElement
   * @param {boolean} preserveState
   */
  async playScene(sceneId, containerElement, preserveState = false) {
    this.stop(!preserveState);
    this.containerElement = containerElement;
    const project = this.projectStore.project;
    if (!project) return;
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    let imageBaseUrl =
      this.imageBaseUrlOverride ||
      `/projects/${encodeURIComponent(project.id)}/images/`;
    if (!this.imageBaseUrlOverride && this.apiClient && this.apiClient.baseUrl) {
      const origin = new URL(this.apiClient.baseUrl).origin;
      imageBaseUrl = `${origin}/projects/${encodeURIComponent(
        project.id
      )}/images/`;
    }
    let audioBaseUrl =
      this.audioBaseUrlOverride ||
      `/projects/${encodeURIComponent(project.id)}/audio/`;
    if (!this.audioBaseUrlOverride && this.apiClient && this.apiClient.baseUrl) {
      const origin = new URL(this.apiClient.baseUrl).origin;
      audioBaseUrl = `${origin}/projects/${encodeURIComponent(
        project.id
      )}/audio/`;
    }

    if (!this.runtimeFlags) {
      this.runtimeFlags = new Set();
    }
    if (!this.runtimeVariables) {
      this.runtimeVariables = new Map();
    }

    if (!this.playTimeStart) {
      this.playTimeStart = Date.now();
    }

    this.player = new ScenePlayer({
      project,
      scene,
      container: containerElement,
      imageBaseUrl,
      audioBaseUrl,
      sharedFlags: this.runtimeFlags,
      sharedVariables: this.runtimeVariables,
      onSceneChange: (targetSceneId) =>
        this.playScene(targetSceneId, this.containerElement, true),
      onNodeVisited: (nodeId) => { },
    });
    this.player.start();

    // Autosave DESPUÉS de iniciar la nueva escena (si está habilitado)
    if (this.saveManager && this.currentSaveSlot && preserveState) {
      // Usar setTimeout para permitir que la escena se renderice primero
      setTimeout(async () => {
        try {
          const gameState = await this.captureGameState();
          if (gameState) {
            await this.saveManager.saveGame(this.currentSaveSlot, gameState);
            console.log(`Auto-saved to slot ${this.currentSaveSlot} at scene start`);
          }
        } catch (err) {
          console.error("Auto-save failed:", err);
        }
      }, 100);
    }
  }

  /**
   * Captura el estado actual del juego para guardado
   */
  async captureGameState() {
    const project = this.projectStore.project;
    if (!project || !this.player) {
      return null;
    }

    // Import dinámico de GameState (solo disponible en juego exportado)
    let GameState;
    try {
      const module = await import("../save/GameState.js");
      GameState = module.GameState;
    } catch (err) {
      console.warn("GameState not available - save system disabled");
      return null;
    }

    const currentPlayTime = this.playTimeStart
      ? this.totalPlayTime + (Date.now() - this.playTimeStart) / 1000
      : this.totalPlayTime;

    const characterVariablesObj = {};
    this.runtimeVariables.forEach((vars, charId) => {
      characterVariablesObj[charId] = { ...vars };
    });

    const characterVisualsObj = {};
    if (this.player.characterVisuals) {
      this.player.characterVisuals.forEach((vis, charId) => {
        const normalizedHeight =
          vis.heightPercent !== undefined
            ? this.player.normalizeHeightPercent(vis.heightPercent)
            : undefined;
        // Solo guardar datos serializables, NO el HTMLImageElement
        characterVisualsObj[charId] = {
          x: vis.x !== undefined ? vis.x : 0.5,
          alpha: vis.alpha !== undefined ? vis.alpha : 1,
          imageId: vis.imageId || null,
          heightPercent: normalizedHeight,
        };
      });
    }

    const currentScene = project.scenes.find(
      (s) => s.id === this.player.scene.id
    );
    const scenePreview = currentScene ? currentScene.name : "Escena desconocida";

    return new GameState({
      projectId: project.id,
      currentSceneId: this.player.scene.id,
      currentNodeId: this.player.currentNodeId,
      flags: Array.from(this.runtimeFlags),
      characterVariables: characterVariablesObj,
      backgroundImageId: this.player.backgroundImageId || null,
      characterVisuals: characterVisualsObj,
      dialogueHistory: this.player.dialogueHistory
        ? this.player.dialogueHistory.toJSON()
        : null,
      playTime: Math.floor(currentPlayTime),
      scenePreview: scenePreview,
    });
  }

  /**
   * Restaura el estado del juego desde un GameState
   */
  async restoreGameState(gameState, containerElement) {
    if (!gameState || !gameState.isValid()) {
      throw new Error("Invalid game state");
    }

    const project = this.projectStore.project;
    if (!project || project.id !== gameState.projectId) {
      throw new Error("Game state project mismatch");
    }

    this.stop(true);

    this.runtimeFlags = new Set(gameState.flags);
    this.runtimeVariables = new Map();
    Object.keys(gameState.characterVariables).forEach((charId) => {
      this.runtimeVariables.set(charId, gameState.characterVariables[charId]);
    });
    this.totalPlayTime = gameState.playTime;
    this.playTimeStart = Date.now();

    // Restaurar historial de diálogos
    let restoredHistory = null;
    if (gameState.dialogueHistory) {
      restoredHistory = DialogueHistory.fromJSON(gameState.dialogueHistory);
    }

    const scene = project.scenes.find((s) => s.id === gameState.currentSceneId);
    if (!scene) {
      throw new Error("Scene not found in project");
    }

    this.containerElement = containerElement;

    let imageBaseUrl =
      this.imageBaseUrlOverride ||
      `/projects/${encodeURIComponent(project.id)}/images/`;
    if (!this.imageBaseUrlOverride && this.apiClient && this.apiClient.baseUrl) {
      const origin = new URL(this.apiClient.baseUrl).origin;
      imageBaseUrl = `${origin}/projects/${encodeURIComponent(
        project.id
      )}/images/`;
    }
    let audioBaseUrl =
      this.audioBaseUrlOverride ||
      `/projects/${encodeURIComponent(project.id)}/audio/`;
    if (!this.audioBaseUrlOverride && this.apiClient && this.apiClient.baseUrl) {
      const origin = new URL(this.apiClient.baseUrl).origin;
      audioBaseUrl = `${origin}/projects/${encodeURIComponent(
        project.id
      )}/audio/`;
    }

    this.player = new ScenePlayer({
      project,
      scene,
      container: containerElement,
      imageBaseUrl,
      audioBaseUrl,
      sharedFlags: this.runtimeFlags,
      sharedVariables: this.runtimeVariables,
      onSceneChange: (targetSceneId) =>
        this.playScene(targetSceneId, this.containerElement, true),
      onNodeVisited: (nodeId) => { },
      startNodeId: gameState.currentNodeId,
      backgroundImageId: gameState.backgroundImageId,
      characterVisuals: gameState.characterVisuals,
      dialogueHistory: restoredHistory,
    });

    this.player.start();
  }
}
