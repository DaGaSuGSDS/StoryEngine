/**
 * ReplaceConnectionCommand.js
 * Command to replace a connection at a specific index.
 */
import { Command } from "./Command.js";

export class ReplaceConnectionCommand extends Command {
    /**
     * @param {Scene} scene
     * @param {string} sourceId
     * @param {number} index
     * @param {string} newTargetId
     */
    constructor(scene, sourceId, index, newTargetId) {
        super();
        this.scene = scene;
        this.sourceId = sourceId;
        this.index = index;
        this.newTargetId = newTargetId;
        this.oldTargetId = null;
    }

    execute() {
        const sourceNode = this.scene.graph.getNode(this.sourceId);
        if (!sourceNode || !sourceNode.nextNodeIds) return false;

        if (this.index < 0 || this.index >= sourceNode.nextNodeIds.length) return false;

        this.oldTargetId = sourceNode.nextNodeIds[this.index];

        // Prevent self-connection or duplicate connection if logic requires unique targets, 
        // but for PlayerOptions multiple options *can* go to same node.
        // Main constraint is usually self-connection.
        if (this.sourceId === this.newTargetId) return false;

        sourceNode.nextNodeIds[this.index] = this.newTargetId;
        return true;
    }

    undo() {
        const sourceNode = this.scene.graph.getNode(this.sourceId);
        if (!sourceNode || !sourceNode.nextNodeIds) return false;

        if (this.index < 0 || this.index >= sourceNode.nextNodeIds.length) return false;

        sourceNode.nextNodeIds[this.index] = this.oldTargetId;
        return true;
    }

    description() {
        return `Reemplazar conexión ${this.index} de ${this.sourceId}`;
    }
}
