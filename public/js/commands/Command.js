export class Command {
  constructor() {
    if (this.constructor === Command) {
      throw new Error("Command es una clase abstracta");
    }
  }

  execute() {
    throw new Error("execute() debe ser implementado");
  }

  undo() {
    throw new Error("undo() debe ser implementado");
  }

  description() {
    return this.constructor.name;
  }
}
