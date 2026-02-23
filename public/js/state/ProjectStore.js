/**
 * ProjectStore.js
 * Central state management for the application.
 */
import { Scene } from "../models/Scene.js";
import { Character } from "../models/Character.js";
import { Flag } from "../models/Flag.js";
import { ImageAsset } from "../models/ImageAsset.js";
import { AudioAsset } from "../models/AudioAsset.js";
import { Graph } from "../models/Graph.js";
import { ProjectSettings } from "../models/ProjectSettings.js";
import { generateId } from "../utils/idGenerator.js";
import { CommandHistory } from "../commands/CommandHistory.js";
import { ImageFolder } from "../models/ImageFolder.js";
import { createNodeFromRaw } from "../models/nodes/nodeFactory.js";

/**
 * Central state management for the application.
 * Uses an Observer pattern to notify subscribers of changes.
 * Stores:
 * - Current Project data (Scenes, Characters, etc.)
 * - Editor State (Current Scene ID)
 * - Command History (Undo/Redo)
 */
export class ProjectStore {
  /**
   * Initializes the store with empty state.
   */
  constructor() {
    this.project = null;
    this.currentSceneId = null;
    this.listeners = new Set();
    this.commandHistory = new CommandHistory(50);
  }

  /**
   * Subscribes a listener to state changes.
   * @param {Function} listener - Callback function invoked on change.
   * @param {string|null} filter - Optional filter to only receive specific updates.
   * @returns {Function} Unsubscribe function.
   */
  subscribe(listener, filter = null) {
    const entry = { listener, filter };
    this.listeners.add(entry);
    return () => this.listeners.delete(entry);
  }

  /**
   * Notifies all subscribers of a change.
   * @param {string|null} changeType - Type of change that occurred.
   */
  notify(changeType = null) {
    this.listeners.forEach((entry) => {
      // If no filter on listener, or no specific change type broadcasted, or match
      if (!entry.filter || !changeType || entry.filter === changeType) {
        entry.listener(changeType);
      }
    });
  }

  /**
   * Loads a project into the store, deserializing all models.
   * @param {Object} rawProject - The raw project data from JSON.
   */
  setProject(rawProject) {
    if (!rawProject) {
      this.project = null;
      this.currentSceneId = null;
      this.commandHistory.clear();
      this.notify();
      return;
    }

    const scenes = (rawProject.scenes || []).map((s) => Scene.fromRaw(s));
    const characters = (rawProject.characters || []).map((c) =>
      Character.fromRaw(c)
    );
    const flags = (rawProject.flags || []).map((f) => Flag.fromRaw(f));
    const images = (rawProject.images || []).map((i) => ImageAsset.fromRaw(i));
    const audio = (rawProject.audio || []).map((a) => AudioAsset.fromRaw(a));
    const imageFolders = (rawProject.imageFolders || []).map((f) =>
      ImageFolder.fromRaw(f)
    );
    const settings = rawProject.settings
      ? ProjectSettings.fromJSON(rawProject.settings)
      : new ProjectSettings();

    this.project = {
      id: rawProject.id,
      name: rawProject.name || rawProject.id,
      scenes,
      characters,
      flags,
      images,
      audio,
      imageFolders,
      settings,
    };

    this.currentSceneId = scenes.length > 0 ? scenes[0].id : null;
    this.commandHistory.clear();
    this.notify();
  }

  /**
   * Serializes the current project state to JSON.
   * @returns {Object|null} Raw project object or null if no project loaded.
   */
  toJSON() {
    if (!this.project) return null;
    return {
      id: this.project.id,
      name: this.project.name,
      scenes: this.project.scenes.map((s) => s.toRaw()),
      characters: this.project.characters.map((c) => c.toRaw()),
      flags: this.project.flags.map((f) => f.toRaw()),
      images: this.project.images.map((i) => i.toRaw()),
      audio: this.project.audio.map((a) => a.toRaw()),
      imageFolders: (this.project.imageFolders || []).map((f) => f.toRaw()),
      settings: this.project.settings ? this.project.settings.toJSON() : new ProjectSettings().toJSON(),
    };
  }

  get scenes() {
    return this.project?.scenes || [];
  }

  get characters() {
    return this.project?.characters || [];
  }

  get flags() {
    return this.project?.flags || [];
  }

  get images() {
    return this.project?.images || [];
  }

  get imageFolders() {
    return this.project?.imageFolders || [];
  }

  get audio() {
    return this.project?.audio || [];
  }

  get currentScene() {
    if (!this.project || !this.currentSceneId) return null;
    return (
      this.project.scenes.find((s) => s.id === this.currentSceneId) || null
    );
  }

  setCurrentScene(id) {
    this.currentSceneId = id;
    this.notify();
  }

  /**
   * Creates and adds a new scene to the project.
   * Automatically sets it as the current scene.
   */
  addScene() {
    if (!this.project) return;
    const id = generateId("scene");
    const scene = new Scene({
      id,
      name: "Nueva escena",
      characterIds: [],
      backgroundImageId: null,
      graph: new Graph(),
    });
    this.project.scenes.push(scene);
    this.currentSceneId = id;
    this.notify();
  }

  removeScene(id) {
    if (!this.project) return;
    this.project.scenes = this.project.scenes.filter((s) => s.id !== id);
    if (this.currentSceneId === id) {
      this.currentSceneId =
        this.project.scenes.length > 0 ? this.project.scenes[0].id : null;
    }
    this.notify();
  }

  addCharacter() {
    if (!this.project) return;
    const id = generateId("char");
    const character = new Character({
      id,
      name: "Nuevo personaje",
      states: [],
      variables: [],
    });
    this.project.characters.push(character);
    this.notify();
  }

  removeCharacter(id) {
    if (!this.project) return;
    this.project.characters = this.project.characters.filter(
      (c) => c.id !== id
    );
    this.notify();
  }

  addFlag() {
    if (!this.project) return;
    const id = generateId("flag");
    const flag = new Flag({ id, name: "Nueva flag" });
    this.project.flags.push(flag);
    this.notify();
  }

  removeFlag(id) {
    if (!this.project) return;
    this.project.flags = this.project.flags.filter((f) => f.id !== id);
    this.notify();
  }

  addImageAsset(asset) {
    if (!this.project) return;
    const image = ImageAsset.fromRaw(asset);
    this.project.images.push(image);
    this.notify();
  }

  removeImageAsset(id) {
    if (!this.project) return;
    this.project.images = this.project.images.filter((i) => i.id !== id);
    this.notify();
  }

  addImageFolder(name, parentId = null) {
    if (!this.project) return null;
    if (!this.project.imageFolders) {
      this.project.imageFolders = [];
    }
    const folder = new ImageFolder({
      id: generateId("imgFolder"),
      name,
      parentId: parentId || null,
    });
    this.project.imageFolders.push(folder);
    this.notify();
    return folder;
  }

  renameImageFolder(folderId, newName) {
    if (!this.project || !this.project.imageFolders) return;
    const folder = this.project.imageFolders.find((f) => f.id === folderId);
    if (!folder) return;
    folder.name = newName;
    this.notify();
  }

  /**
   * Deletes an image folder and moves its contents to the root.
   * @param {string} folderId - ID of the folder to delete.
   */
  deleteImageFolder(folderId) {
    if (!this.project || !this.project.imageFolders) return;
    const folders = this.project.imageFolders;
    const images = this.project.images || [];

    // Identify all folders to delete (the target folder and its subfolders)
    const collectIds = new Set();
    const stack = [folderId];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || collectIds.has(current)) continue;
      collectIds.add(current);
      folders
        .filter((f) => f.parentId === current)
        .forEach((child) => stack.push(child.id));
    }

    // Move images from deleted folders to root (null folderId)
    images.forEach((img) => {
      if (img.folderId && collectIds.has(img.folderId)) {
        img.folderId = null;
      }
    });

    // Remove the folders from state
    this.project.imageFolders = folders.filter((f) => !collectIds.has(f.id));
    this.notify();
  }

  setImageFolderForImage(imageId, folderId) {
    if (!this.project) return;
    const img = this.project.images.find((i) => i.id === imageId);
    if (!img) return;
    img.folderId = folderId || null;
    this.notify();
  }

  addAudioAsset(asset) {
    if (!this.project) return;
    const audio = AudioAsset.fromRaw(asset);
    this.project.audio.push(audio);
    this.notify();
  }

  removeAudioAsset(id) {
    if (!this.project) return;
    this.project.audio = this.project.audio.filter((a) => a.id !== id);
    this.notify();
  }

  addNodeToCurrentScene(type) {
    const scene = this.currentScene;
    if (!scene) return;
    const node = createNodeFromRaw({
      id: generateId("node"),
      type,
      name: type,
      x: 50,
      y: 50,
      data: {},
      nextNodeIds: [],
    });
    scene.graph.addNode(node);
    if (!scene.graph.startNodeId) {
      scene.graph.startNodeId = node.id;
    }
    this.notify();
  }

  removeNodeFromCurrentScene(nodeId) {
    const scene = this.currentScene;
    if (!scene) return;
    scene.graph.removeNode(nodeId);
    if (scene.graph.startNodeId === nodeId) {
      scene.graph.startNodeId = null;
    }
    this.notify();
  }

  /**
   * Executes a command via the CommandHistory for undo/redo support.
   * @param {Command} command - The command object to execute.
   * @returns {boolean} True if execution was successful.
   */
  executeCommand(command) {
    const success = this.commandHistory.execute(command);
    if (success) {
      this.notify();
    }
    return success;
  }

  undo() {
    const success = this.commandHistory.undo();
    if (success) {
      this.notify();
    }
    return success;
  }

  redo() {
    const success = this.commandHistory.redo();
    if (success) {
      this.notify();
    }
    return success;
  }

  canUndo() {
    return this.commandHistory.canUndo();
  }

  canRedo() {
    return this.commandHistory.canRedo();
  }
}
