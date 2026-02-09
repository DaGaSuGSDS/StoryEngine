export class Character {
  constructor({ id, name, states, variables }) {
    this.id = id;
    this.name = name;
    this.states = states || [];
    this.variables = variables || [];
  }

  static fromRaw(raw) {
    return new Character({
      id: raw.id,
      name: raw.name,
      states: raw.states || [],
      variables: raw.variables || [],
    });
  }

  toRaw() {
    return {
      id: this.id,
      name: this.name,
      states: this.states,
      variables: this.variables,
    };
  }
}

