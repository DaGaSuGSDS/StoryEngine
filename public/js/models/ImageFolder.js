/**
 * ImageFolder.js
 * Model representing a folder structure for organizing images.
 */
import { generateId } from "../utils/idGenerator.js";

/**
 * Represents a folder for organizing images.
 */
export class ImageFolder {
  /**
   * @param {Object} data - Folder data.
   * @param {string} data.id - Folder ID.
   * @param {string} data.name - Folder name.
   * @param {string} [data.parentId] - ID of the parent folder.
   */
  constructor({ id, name, parentId = null }) {
    this.id = id;
    this.name = name;
    this.parentId = parentId || null;
  }

  /**
   * Creates an ImageFolder from raw data.
   * @param {Object} raw - Raw data.
   * @returns {ImageFolder} ImageFolder instance.
   */
  static fromRaw(raw) {
    return new ImageFolder({
      id: raw.id,
      name: raw.name,
      parentId: raw.parentId || null,
    });
  }

  /**
   * Converts the folder to a raw object.
   * @returns {Object} Raw data.
   */
  toRaw() {
    return {
      id: this.id,
      name: this.name,
      parentId: this.parentId,
    };
  }
}

