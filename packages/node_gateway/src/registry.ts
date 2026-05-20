export class User {

    _socketId: string;
    private jobs: Array<string>;
    static allInstances: Array<User> = [];

    constructor(socketId: string) {
        this._socketId = socketId;
        this.jobs = [];
        User.allInstances.push(this);
    }

    static findBySocketId(socketId: string): User | undefined {
        return User.allInstances.find(u => u._socketId === socketId);
    }

    public createJob(jobId: string): void {
        this.jobs.push(jobId);
    }

    public getJobs(): Array<string> {
        return [...this.jobs];
    }

    public markJobDone(jobId: string): void {
        this.jobs = this.jobs.filter(id => id !== jobId);
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

    public assignedJobs(jobId: string): void {
        this.jobs.push(jobId);
    }

    public getJobs(): Array<string> {
        return this.jobs;
    }

    public markJobDone(jobId: string): void {
        this.jobs = this.jobs.filter(id => id === jobId);
    }

    static remove(socketId: string) {
        Node.allInstances = Node.allInstances.filter(n => n._socketId !== socketId);
    }
}
