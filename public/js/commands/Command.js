/**
 * Command.js
 * Base class for all undoable commands in the application.
 */
/**
 * Base abstract class for commands (Undo/Redo pattern).
 */
export class Command {
  /**
   * Initializes the command.
   * @throws {Error} If instantiated directly.
   */
  constructor() {
    if (this.constructor === Command) {
      throw new Error("Command es una clase abstracta");
    }
  }

  /**
   * Executes the command.
   * @returns {boolean} True if successful.
   */
  execute() {
    throw new Error("execute() debe ser implementado");
  }

  /**
   * Reverts the command.
   * @returns {boolean} True if successful.
   */
  undo() {
    throw new Error("undo() debe ser implementado");
  }

  /**
   * Gets a description of the command.
   * @returns {string} Description.
   */
  description() {
    return this.constructor.name;
  }
}
