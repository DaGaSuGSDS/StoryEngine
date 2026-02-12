import { Command } from "./Command.js";

export class ConnectNodeCommand extends Command {
    constructor(scene, sourceId, targetId) {
        super();
        this.scene = scene;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.alreadyconnected = false;
    }

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

    description() {
        return `Conectar nodo ${this.sourceId} a ${this.targetId}`;
    }
}
