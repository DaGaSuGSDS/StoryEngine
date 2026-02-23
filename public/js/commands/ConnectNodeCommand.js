/**
 * ConnectNodeCommand.js
 * Command to create a connection (edge) between two nodes.
 */
import { Command } from "./Command.js";
import { NODE_TYPES } from "../models/nodes/nodeTypes.js";

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

        // Check for PlayerOptions specific logic
        if (sourceNode.type === NODE_TYPES.PLAYER_OPTIONS) {
            // Ensure options array exists
            if (!sourceNode.options) sourceNode.options = [];

            // If we are pushing a new connection (at the end), we should add a new option
            // But verify we don't already have an option for this index?
            // The index of the new connection will be sourceNode.nextNodeIds.length (after push)
            // But here we push *after*.
            // Let's assume 1-to-1 mapping.
            // If options.length < nextNodeIds.length + 1 (size after push), add option.

            // Actually simpler: just push a new option.
            this.addedOption = false; // Track if we added one for Undo
            if (sourceNode.options.length <= sourceNode.nextNodeIds.length) {
                sourceNode.options.push("Nueva opción");
                this.addedOption = true;
            }
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

            // Undo option addition if we added one
            // We only remove if we specifically added it, to avoid deleting user text if they undid.
            // But typically Undo should restore EXACT state.
            // If we added "Nueva opción" at the end, we should remove it.
            if (this.addedOption && sourceNode.type === NODE_TYPES.PLAYER_OPTIONS && sourceNode.options) {
                // Remove the option at the same index, or just pop?
                // Logic: we pushed at the end. So we should remove the last one? 
                // Wait, ConnectNodeCommand logic was "push". So verify index is last?
                // Yes, ConnectCommand (adding new) implies append.
                // So we can remove the one at 'index'.
                if (index < sourceNode.options.length) {
                    sourceNode.options.splice(index, 1);
                }
            }
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
