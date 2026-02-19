/**
 * CommandHistory.js
 * Manages the history of executed commands for Undo/Redo functionality.
 */
/**
 * Manages the history of commands for undo/redo functionality.
 */
export class CommandHistory {
  /**
   * @param {number} maxSize - Maximum history size.
   */
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Executes a command and adds it to history.
   * @param {Command} command - Command to execute.
   * @returns {boolean} True if successful.
   */
  execute(command) {
    const success = command.execute();

    if (success) {
      this.history = this.history.slice(0, this.currentIndex + 1);

      this.history.push(command);
      this.currentIndex++;

      if (this.history.length > this.maxSize) {
        this.history.shift();
        this.currentIndex--;
      }
    }

    return success;
  }

  /**
   * Undoes the last command.
   * @returns {boolean} True if successful.
   */
  undo() {
    if (!this.canUndo()) {
      return false;
    }

    const command = this.history[this.currentIndex];
    const success = command.undo();

    if (success) {
      this.currentIndex--;
    }

    return success;
  }

  /**
   * Redoes the previously undone command.
   * @returns {boolean} True if successful.
   */
  redo() {
    if (!this.canRedo()) {
      return false;
    }

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    return command.execute();
  }

  /**
   * Checks if undo is available.
   * @returns {boolean}
   */
  canUndo() {
    return this.currentIndex >= 0;
  }

  /**
   * Checks if redo is available.
   * @returns {boolean}
   */
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clears the history.
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Gets the command history list.
   * @returns {Array} List of commands with descriptions.
   */
  getHistory() {
    return this.history.map((cmd, i) => ({
      description: cmd.description(),
      current: i === this.currentIndex,
    }));
  }
}
