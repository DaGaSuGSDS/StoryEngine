/**
 * ConnectNodeCommand.js
 * Command to create a connection (edge) between two nodes.
 */
import { Command } from "./Command.js";

/**
 * Command to connect two nodes.
 */
export class ConnectNodeCommand extends Command {
    /**
     * @param {Scene} scene - Target scene.
     * @param {string} sourceId - Source node ID.
     * @param {string} targetId - Target node ID.
     */
    constructor(scene, sourceId, targetId) {
        super();
        this.scene = scene;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.alreadyconnected = false;
    }

    /**
     * Creates the connection.
     */
    execute() {
        const sourceNode = this.scene.graph.getNode(this.sourceId);
        const targetNode = this.scene.graph.getNode(this.targetId);

        if (!sourceNode || !targetNode) return false;

        if (!sourceNode.nextNodeIds) {
            sourceNode.nextNodeIds = [];
        }

        if (sourceNode.nextNodeIds.includes(this.targetId)) {
            this.alreadyconnected = true;
            return false; // Already connected, technically not a failure but nothing to do
        }

        sourceNode.nextNodeIds.push(this.targetId);
        return true;
    }

    /**
     * Removes the connection.
     */
    undo() {
        if (this.alreadyconnected) return true;

        const sourceNode = this.scene.graph.getNode(this.sourceId);
        if (!sourceNode || !sourceNode.nextNodeIds) return false;

        const index = sourceNode.nextNodeIds.indexOf(this.targetId);
        if (index !== -1) {
            sourceNode.nextNodeIds.splice(index, 1);
        }
        return true;
    }

    /**
     * @returns {string} Description.
     */
    description() {
        return `Conectar nodo ${this.sourceId} a ${this.targetId}`;
    }
}
