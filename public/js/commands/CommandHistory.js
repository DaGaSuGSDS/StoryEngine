export class CommandHistory {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.history = [];
    this.currentIndex = -1;
  }

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

  redo() {
    if (!this.canRedo()) {
      return false;
    }

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    return command.execute();
  }

  canUndo() {
    return this.currentIndex >= 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistory() {
    return this.history.map((cmd, i) => ({
      description: cmd.description(),
      current: i === this.currentIndex,
    }));
  }
}
