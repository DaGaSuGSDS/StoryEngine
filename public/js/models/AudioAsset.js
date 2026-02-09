export class AudioAsset {
  constructor({ id, name, fileName }) {
    this.id = id;
    this.name = name;
    this.fileName = fileName;
  }

  static fromRaw(raw) {
    return new AudioAsset({
      id: raw.id,
      name: raw.name,
      fileName: raw.fileName,
    });
  }

  toRaw() {
    return {
      id: this.id,
      name: this.name,
      fileName: this.fileName,
    };
  }
}

