import { Command } from "./Command.js";

export class DisconnectNodeCommand extends Command {
    constructor(scene, sourceId, targetId) {
        super();
        this.scene = scene;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.index = -1;
    }

    execute() {
        const sourceNode = this.scene.graph.getNode(this.sourceId);
        if (!sourceNode || !sourceNode.nextNodeIds) return false;

        this.index = sourceNode.nextNodeIds.indexOf(this.targetId);
        if (this.index === -1) return false;

        sourceNode.nextNodeIds.splice(this.index, 1);
        return true;
    }

    undo() {
        const sourceNode = this.scene.graph.getNode(this.sourceId);
        if (!sourceNode) return false;

        if (!sourceNode.nextNodeIds) sourceNode.nextNodeIds = [];

        // Restore at original index if possible, otherwise push
        if (this.index >= 0 && this.index <= sourceNode.nextNodeIds.length) {
            sourceNode.nextNodeIds.splice(this.index, 0, this.targetId);
        } else {
            sourceNode.nextNodeIds.push(this.targetId);
        }
        return true;
    }

    description() {
        return `Desconectar nodo ${this.sourceId} de ${this.targetId}`;
    }
}
