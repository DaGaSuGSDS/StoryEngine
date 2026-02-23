/**
 * AudioAsset.js
 * Model representing an audio file asset.
 */
import { generateId } from "../utils/idGenerator.js";

/**
 * Represents an audio asset.
 */
export class AudioAsset {
  /**
   * @param {Object} data - Audio asset data.
   * @param {string} [data.id] - Asset ID. If not provided, a new one will be generated.
   * @param {string} data.name - Asset name.
   * @param {string} data.fileName - File name.
   */
  constructor({ id = generateId(), name, fileName }) {
    this.id = id;
    this.name = name;
    this.fileName = fileName;
  }

  /**
   * Creates an AudioAsset from raw data.
   * @param {Object} raw - Raw data.
   * @returns {AudioAsset} AudioAsset instance.
   */
  static fromRaw(raw) {
    return new AudioAsset({
      id: raw.id,
      name: raw.name,
      fileName: raw.fileName,
    });
  }

  /**
   * Converts the audio asset to a raw object.
   * @returns {Object} Raw data.
   */
  toRaw() {
    return {
      id: this.id,
      name: this.name,
      fileName: this.fileName,
    };
  }
}

