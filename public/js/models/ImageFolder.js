export class ImageFolder {
  constructor({ id, name, parentId = null }) {
    this.id = id;
    this.name = name;
    this.parentId = parentId || null;
  }

  static fromRaw(raw) {
    return new ImageFolder({
      id: raw.id,
      name: raw.name,
      parentId: raw.parentId || null,
    });
  }

  toRaw() {
    return {
      id: this.id,
      name: this.name,
      parentId: this.parentId,
    };
  }
}

