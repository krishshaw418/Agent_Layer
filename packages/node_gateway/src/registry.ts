export class Server {

    _socketId: string;
    _jobs: Array<string>;
    static allInstances: Array<Server> = [];

    constructor(socketId: string) {
        this._socketId = socketId;
        this._jobs = [];
        Server.allInstances.push(this);
    }

    _setNewJob(jobId: string): void {
        this._jobs.push(jobId);
    }

    public getJobs(): Array<string> {
        return this._jobs;
    }

    public getJobById(jobId: string): string | undefined {
        return this._jobs.find((id) => id === jobId);
    }

    _deleteJob(jobId: string) {
        this._jobs = this._jobs.filter(id => id !== jobId);
    }

    static remove(socketId: string) {
        Server.allInstances = Server.allInstances.filter(s => s._socketId !== socketId);
    }

}

export class User {

    _socketId: string;
    static allInstances: Array<User> = [];

    constructor(socketId: string) {
        this._socketId = socketId;
        User.allInstances.push(this);
    }

    static remove(socketId: string): void {
        User.allInstances = User.allInstances.filter(u => u._socketId !== socketId);
    }

}

export class Node {

    _socketId: string;
    _nodeId: string;
    private jobs: Array<string>;
    static allInstances: Array<Node> = [];

    constructor(socketId: string, nodeId: string) {
        this._socketId = socketId;
        this._nodeId = nodeId;
        this.jobs = [];
        Node.allInstances.push(this);
    }

    static findBySocketId(socketId: string): Node | undefined {
        return Node.allInstances.find(n => n._socketId === socketId);
    }

    _assignedJobs(jobId: string): void {
        this.jobs.push(jobId);
    }

    public getJobs(): Array<string> {
        return this.jobs;
    }

    public getJobById(jobId: string): string | undefined {
        return this.jobs.find((id) => id === jobId);
    }

    _markJobDone(jobId: string): void {
        this.jobs = this.jobs.filter(id => id !== jobId);
    }

    static remove(socketId: string) {
        Node.allInstances = Node.allInstances.filter(n => n._socketId !== socketId);
    }
}

export namespace Response {
    export const RESPONSE: Map<string, Array<string>> = new Map();
    export const JOB_REQUESTER: Map<string, string> = new Map();

    export function init(jobId: string): void {
        RESPONSE.set(jobId, []);
    }

    export function cleanup(jobId: string): void {
        RESPONSE.delete(jobId);
        JOB_REQUESTER.delete(jobId);
    }
}