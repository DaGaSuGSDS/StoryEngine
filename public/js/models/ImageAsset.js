export class ImageAsset {
  constructor({ id, name, fileName, folderId = null }) {
    this.id = id;
    this.name = name;
    this.fileName = fileName;
    this.folderId = folderId || null;
  }

  static fromRaw(raw) {
    return new ImageAsset({
      id: raw.id,
      name: raw.name,
      fileName: raw.fileName,
      folderId: raw.folderId || null,
    });
  }

  toRaw() {
    return {
      id: this.id,
      name: this.name,
      fileName: this.fileName,
      folderId: this.folderId,
    };
  }
}
