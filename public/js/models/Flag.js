export class Flag {
  constructor({ id, name }) {
    this.id = id;
    this.name = name;
  }

  static fromRaw(raw) {
    return new Flag({
      id: raw.id,
      name: raw.name,
    });
  }

  toRaw() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}

