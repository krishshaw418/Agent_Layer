class UserJobRegistry {

    private userJobRegistry: Map<string, string>;

    constructor() {
        this.userJobRegistry = new Map();
    }

    public pushRecord(socketId: string, jobId: string): void {
        this.userJobRegistry.set(socketId, jobId);
    }

    public getRecords(): Map<string, string> {
        return this.userJobRegistry;
    }

    public popRecord(socketId: string): void {
        this.userJobRegistry.delete(socketId);
    }

}

class NodeJobRegistry {
    private nodeJobRegistry: Map<string, string>;

    constructor() {
        this.nodeJobRegistry = new Map();
    }

    public pushRecord(socketId: string, jobId: string): void {
        this.nodeJobRegistry.set(socketId, jobId);
    }

    public getRecords(): Map<string, string> {
        return this.nodeJobRegistry;
    }

    public popRecord(socketId: string): void {
        this.nodeJobRegistry.delete(socketId);
    }
}

export const userJobRegistry = new UserJobRegistry();
export const nodeJobRegistry = new NodeJobRegistry();