import { GameState } from "./GameState.js";

/**
 * SaveManager - Gestiona el guardado y carga de partidas usando Electron fs
 * Solo funciona en el juego exportado con Electron
 */
export class SaveManager {
  constructor(projectId) {
    this.projectId = projectId;
    this.isElectron = this.detectElectron();
    this.savesDir = null;
    this.maxSlots = 10;
    this.initPromise = null;

    if (this.isElectron) {
      this.initPromise = this.initializeSavesDirectory();
    }
  }

  /**
   * Espera a que la inicialización termine
   */
  async ensureInitialized() {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Detecta si estamos corriendo en Electron
   */
  detectElectron() {
    return !!(
      typeof window !== "undefined" &&
      window.electron &&
      window.electron.saveGame
    );
  }

  /**
   * Inicializa el directorio de guardados
   */
  async initializeSavesDirectory() {
    if (!this.isElectron) {
      console.warn("SaveManager: Not running in Electron, saves disabled");
      return;
    }

    try {
      const userDataPath = await window.electron.getUserDataPath();
      // Construir path manualmente sin usar IPC
      this.savesDir = `${userDataPath}/StoryEngine_${this.projectId}/saves`.replace(/\\/g, '/');

      await window.electron.ensureDir(this.savesDir);
      console.log(`SaveManager: Initialized saves directory at ${this.savesDir}`);
    } catch (err) {
      console.error("SaveManager: Failed to initialize saves directory", err);
    }
  }

  /**
   * Guarda el estado del juego en un slot
   */
  async saveGame(slotNumber, gameState) {
    await this.ensureInitialized();

    if (!this.isElectron) {
      throw new Error("Save system only available in Electron build");
    }

    if (!gameState || !gameState.isValid()) {
      throw new Error("Invalid game state");
    }

    // Convertir a objeto plano ANTES de cualquier operación
    const saveData = gameState.toJSON();
    saveData.slotNumber = slotNumber;
    saveData.timestamp = Date.now();

    const filename = this.getSlotFilename(slotNumber);

    // Construir filepath sin usar IPC para path.join
    const filepath = `${this.savesDir}/${filename}`.replace(/\\/g, '/');

    try {
      const data = JSON.stringify(saveData, null, 2);
      await window.electron.saveGame(filepath, data);
      console.log(`SaveManager: Game saved to slot ${slotNumber}`);
      return true;
    } catch (err) {
      console.error(`SaveManager: Failed to save game to slot ${slotNumber}`, err);
      throw err;
    }
  }

  /**
   * Carga el estado del juego desde un slot
   */
  async loadGame(slotNumber) {
    await this.ensureInitialized();

    if (!this.isElectron) {
      throw new Error("Save system only available in Electron build");
    }

    const filename = this.getSlotFilename(slotNumber);
    const filepath = `${this.savesDir}/${filename}`.replace(/\\/g, '/');

    try {
      const exists = await window.electron.fileExists(filepath);
      if (!exists) {
        return null;
      }

      const data = await window.electron.loadGame(filepath);
      const json = JSON.parse(data);
      const gameState = GameState.fromJSON(json);

      if (!gameState.isValid()) {
        throw new Error("Loaded game state is invalid");
      }

      console.log(`SaveManager: Game loaded from slot ${slotNumber}`);
      return gameState;
    } catch (err) {
      console.error(`SaveManager: Failed to load game from slot ${slotNumber}`, err);
      throw err;
    }
  }

  /**
   * Elimina un guardado
   */
  async deleteSave(slotNumber) {
    await this.ensureInitialized();

    if (!this.isElectron) {
      throw new Error("Save system only available in Electron build");
    }

    const filename = this.getSlotFilename(slotNumber);
    const filepath = `${this.savesDir}/${filename}`.replace(/\\/g, '/');

    try {
      const exists = await window.electron.fileExists(filepath);
      if (!exists) {
        return false;
      }

      await window.electron.deleteFile(filepath);
      console.log(`SaveManager: Deleted save slot ${slotNumber}`);
      return true;
    } catch (err) {
      console.error(`SaveManager: Failed to delete save slot ${slotNumber}`, err);
      throw err;
    }
  }

  /**
   * Lista todos los guardados disponibles
   */
  async listSaves() {
    await this.ensureInitialized();

    if (!this.isElectron) {
      return [];
    }

    try {
      const saves = [];

      for (let i = 1; i <= this.maxSlots; i++) {
        const gameState = await this.loadGame(i);
        if (gameState) {
          saves.push(gameState.getDisplayInfo());
        } else {
          saves.push({
            slotNumber: i,
            empty: true,
          });
        }
      }

      return saves;
    } catch (err) {
      console.error("SaveManager: Failed to list saves", err);
      return [];
    }
  }

  /**
   * Verifica si existe un guardado en un slot
   */
  async hasSave(slotNumber) {
    await this.ensureInitialized();

    if (!this.isElectron) {
      return false;
    }

    const filename = this.getSlotFilename(slotNumber);
    const filepath = `${this.savesDir}/${filename}`.replace(/\\/g, '/');

    try {
      return await window.electron.fileExists(filepath);
    } catch (err) {
      return false;
    }
  }

  /**
   * Obtiene el nombre de archivo para un slot
   */
  getSlotFilename(slotNumber) {
    if (slotNumber === this.quickSaveSlot || slotNumber === this.autoSaveSlot) {
      return `${slotNumber}.save`;
    }
    return `slot_${slotNumber}.save`;
  }

  /**
   * Verifica si el sistema de guardado está disponible
   */
  isAvailable() {
    return this.isElectron && this.savesDir !== null;
  }
}
