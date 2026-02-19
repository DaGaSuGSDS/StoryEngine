/**
 * Represents a game flag (boolean state).
 */
export class Flag {
  /**
   * @param {Object} data - Flag data.
   * @param {string} data.id - Flag ID.
   * @param {string} data.name - Flag name.
   */
  constructor({ id, name }) {
    this.id = id;
    this.name = name;
  }

  /**
   * Creates a Flag from raw data.
   * @param {Object} raw - Raw data.
   * @returns {Flag} Flag instance.
   */
  static fromRaw(raw) {
    return new Flag({
      id: raw.id,
      name: raw.name,
    });
  }

  /**
   * Converts the flag to a raw object.
   * @returns {Object} Raw data.
   */
  toRaw() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}

