import { Command } from "./Command.js";

/**
 * Mueve varios nodos en un solo comando (para undo/redo coherente).
 */
export class MoveNodesCommand extends Command {
  /**
   * @param {Scene} scene
   * @param {Array<{id:string, fromX:number, fromY:number, toX:number, toY:number}>} moves
   */
  constructor(scene, moves) {
    super();
    this.scene = scene;
    this.moves = moves || [];
  }

  execute() {
    if (!this.scene || !this.scene.graph || !this.moves.length) return false;
    let applied = false;
    this.moves.forEach((move) => {
      const node = this.scene.graph.getNode(move.id);
      if (!node) return;
      node.x = move.toX;
      node.y = move.toY;
      applied = true;
    });
    return applied;
  }

  undo() {
    if (!this.scene || !this.scene.graph || !this.moves.length) return false;
    let applied = false;
    this.moves.forEach((move) => {
      const node = this.scene.graph.getNode(move.id);
      if (!node) return;
      node.x = move.fromX;
      node.y = move.fromY;
      applied = true;
    });
    return applied;
  }

  description() {
    return `Mover ${this.moves.length} nodo(s)`;
  }
}
