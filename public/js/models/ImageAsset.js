/**
 * Represents an image asset.
 */
export class ImageAsset {
  /**
   * @param {Object} data - Image asset data.
   * @param {string} data.id - Asset ID.
   * @param {string} data.name - Asset name.
   * @param {string} data.fileName - File name.
   * @param {string} [data.folderId] - ID of the folder containing this image.
   */
  constructor({ id, name, fileName, folderId = null }) {
    this.id = id;
    this.name = name;
    this.fileName = fileName;
    this.folderId = folderId || null;
  }

  /**
   * Creates an ImageAsset from raw data.
   * @param {Object} raw - Raw data.
   * @returns {ImageAsset} ImageAsset instance.
   */
  static fromRaw(raw) {
    return new ImageAsset({
      id: raw.id,
      name: raw.name,
      fileName: raw.fileName,
      folderId: raw.folderId || null,
    });
  }

  /**
   * Converts the image asset to a raw object.
   * @returns {Object} Raw data.
   */
  toRaw() {
    return {
      id: this.id,
      name: this.name,
      fileName: this.fileName,
      folderId: this.folderId,
    };
  }
}
