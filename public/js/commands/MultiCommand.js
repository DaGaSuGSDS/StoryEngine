/**
 * MultiCommand.js
 * Command that groups multiple other commands into a single undoable action (Macro).
 */
import { Command } from "./Command.js";

/**
 * Ejecuta varios comandos como una sola entrada en el historial (undo/redo grupal).
 */
export class MultiCommand extends Command {
  /**
   * @param {Command[]} commands
   * @param {string} descriptionText
   */
  /**
   * @param {Command[]} commands
   * @param {string} descriptionText
   */
  constructor(commands = [], descriptionText = null) {
    super();
    this.commands = commands;
    this.descriptionText = descriptionText;
  }

  /**
   * Executes all child commands sequentially.
   * If one fails, undoes previous ones.
   */
  execute() {
    const executed = [];
    for (const cmd of this.commands) {
      const ok = cmd.execute();
      if (!ok) {
        // revertir lo aplicado
        for (let i = executed.length - 1; i >= 0; i--) {
          executed[i].undo();
        }
        return false;
      }
      executed.push(cmd);
    }
    return true;
  }

  /**
   * Undoes all child commands in reverse order.
   */
  undo() {
    let allOk = true;
    for (let i = this.commands.length - 1; i >= 0; i--) {
      const ok = this.commands[i].undo();
      if (!ok) {
        allOk = false;
      }
    }
    return allOk;
  }

  /**
   * @returns {string} Description.
   */
  description() {
    if (this.descriptionText) return this.descriptionText;
    return `Comandos agrupados (${this.commands.length})`;
  }
}
