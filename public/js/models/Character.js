/**
 * Represents a game character.
 */
export class Character {
  /**
   * @param {Object} data - Character data.
   * @param {string} data.id - Character ID.
   * @param {string} data.name - Character name.
   * @param {Array} [data.states] - List of states (expressions).
   * @param {Array} [data.variables] - List of variables.
   */
  constructor({ id, name, states, variables }) {
    this.id = id;
    this.name = name;
    this.states = states || [];
    this.variables = variables || [];
  }

  /**
   * Creates a Character instance from raw data.
   * @param {Object} raw - Raw data object.
   * @returns {Character} Character instance.
   */
  static fromRaw(raw) {
    return new Character({
      id: raw.id,
      name: raw.name,
      states: raw.states || [],
      variables: raw.variables || [],
    });
  }

  /**
   * Converts the character to a raw object.
   * @returns {Object} Raw data.
   */
  toRaw() {
    return {
      id: this.id,
      name: this.name,
      states: this.states,
      variables: this.variables,
    };
  }
}

