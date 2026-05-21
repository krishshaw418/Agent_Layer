import { createWebSocketServer } from "./server";
import { config } from "./config";
import { Server, Node, User, Response } from "./registry";
import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import { msgSchema } from "./schema";

interface IdentifiedWebSocket extends WebSocket {
    id: string;
}

async function main() {
    const wsServer = createWebSocketServer();

    wsServer.on('error', (err) => {
        console.error(err);
    })

    wsServer.on('connection', (ws, req) => {

        const fullUrl = 'http://' + req.headers.host + req.url;
        const { searchParams } = new URL(fullUrl);
        const type = searchParams.get('type');

        if (!type) {
            return ws.send(JSON.stringify({ event: "err", data: "Missing type query params!" }));
        }

        let client = ws as IdentifiedWebSocket;
        let server: Server;
        let node: Node;
        let user: User;

        if (type === "server") {
            client.id = uuidv4();
            server = new Server(client.id);
            console.log(`Server Connected: ${client.id}`);
        } else if (type === "node") {
            const nodeId = searchParams.get('nodeId');
            if (!nodeId) {
                console.error("Missing nodeId!");
                return ws.send(JSON.stringify({ event: "err", data: "Missing nodeId query params!" }));
            }
            client.id = uuidv4();
            node = new Node(client.id, nodeId);
            console.log(`Node connected: ${client.id}`);
        } else if (type === "user") {
            client.id = uuidv4();
            user = new User(client.id);
            console.log(`User connected: ${client.id}`);
        } else {
            client.send(JSON.stringify({ event: "err", data: "Invalid client type!" }));
            return;
        }

        client.on('error', (err) => {
            console.error(err);
        });

        client.on('close', () => {

            for (let i = 0; i < Server.allInstances.length; i++) {
                if (client.id === Server.allInstances[i]?._socketId) {
                    Server.remove(client.id);
                    console.log(`Server disconnected: ${client.id}`);
                }
            }

            for (let i = 0; i < User.allInstances.length; i++) {
                if (client.id === User.allInstances[i]?._socketId) {
                    User.remove(client.id);
                    console.log(`User disconnected: ${client.id}`);
                }
            }

            for (let i = 0; i < Node.allInstances.length; i++) {
                if (client.id === Node.allInstances[i]?._socketId) {
                    Node.remove(client.id);
                    console.log(`Node disconnected: ${client.id}`);
                }
            }

            console.log("Servers left: \n");
            Server.allInstances.forEach((u) => {
                console.log("Server: ", u._socketId);
            });

            console.log("Users left: \n");
            User.allInstances.forEach((u) => {
                console.log("User: ", u._socketId);
            });

            console.log("Nodes left: \n");
            Node.allInstances.forEach((n) => {
                console.log("Node: ", n._socketId);
            });
        });

        client.on('message', (data, _isBinary) => {
            const parsed = msgSchema.safeParse(JSON.parse(data.toString()));

            if (!parsed.success) {
                client.send(`Error: ${parsed.error}`);
                return;
            }

            const msg = parsed.data;

            switch (msg.event) {
                case "new-job": {
                    const jobId = msg.data.jobId;

                    server._setNewJob(jobId);
                    Response.init(jobId); // initialize response buffer
                    console.log(`New job posted by server: ${server.getJobById(jobId)}`);
                    client.send(JSON.stringify({ event: "ack", data: `Job Id: ${jobId} published!` }));

                    wsServer.clients.forEach((c) => {
                        if (c !== client && c.readyState === WebSocket.OPEN) {
                            c.send(JSON.stringify({ event: "jobs", data: msg.data }));
                        }
                    });

                    break;
                }
                case "assign-job": {
                    const nodeId = msg.data.nodeId;
                    const jobId = msg.data.jobId;
                    if (!nodeId) {
                        console.error("Missing nodeId in assign_job event data!");
                        return;
                    }

                    const targetNode = Node.allInstances.find((n) => n._nodeId === nodeId);

                    if (!targetNode) {
                        client.send(JSON.stringify({ event: "err", data: `Node ${nodeId} not found!` }));
                        return;
                    }

                    targetNode._assignedJobs(jobId);
                    console.log(`Job ${targetNode.getJobById(jobId)} assigned to node ${targetNode._nodeId}`);

                    wsServer.clients.forEach((c) => {
                        if (c !== client && c.readyState === WebSocket.OPEN) {
                            c.send(JSON.stringify({ event: "assigned-job", data: msg.data }));
                        }
                    });

                    client.send(JSON.stringify({ event: "ack", data: `Job ${targetNode.getJobById(jobId)} assigned to node ${targetNode._nodeId}` }));
                    break;
                }
                case "subscribe_to_response": {
                    const jobId = msg.data.jobId;

                    Response.JOB_REQUESTER.set(jobId, client.id);

                    client.send(JSON.stringify({ event: "ack", data: `Subscribed to job ${jobId}` }));
                    break;
                }
                case "response-stream": {
                    const jobId = msg.data.jobId;
                    const chunk = msg.data.chunk;
                    if (!chunk) return;

                    console.log("Chunk: ", chunk + '\n');
                    Response.RESPONSE.get(jobId)?.push(chunk);

                    // Forward chunk directly to the subscribed SDK client
                    const requesterId = Response.JOB_REQUESTER.get(jobId);
                    if (requesterId) {
                        wsServer.clients.forEach((c) => {
                            const identified = c as IdentifiedWebSocket;
                            if (identified.id === requesterId && c.readyState === WebSocket.OPEN) {
                                c.send(JSON.stringify({ event: "response", data: chunk }));
                            }
                        });
                    }

                    break;
                }
                case "response-stream-end": {
                    const jobId = msg.data.jobId;
                    const requesterId = Response.JOB_REQUESTER.get(jobId);
                    if (!requesterId) return;

                    const processingNode = Node.findBySocketId(client.id);
                    processingNode?._markJobDone(jobId);

                    const serverInstance = Server.allInstances.find(s => s.getJobById(jobId));
                    serverInstance?._deleteJob(jobId);

                    // Notify SDK that stream is complete
                    wsServer.clients.forEach((c) => {
                        const identified = c as IdentifiedWebSocket;
                        if (identified.id === requesterId && c.readyState === WebSocket.OPEN) {
                            c.send(JSON.stringify({ event: "response-end", data: jobId }));
                        }
                    });

                    Response.cleanup(jobId);
                    break;
                }
                default: {
                    client.send(JSON.stringify({ event: "err", data: "No such event found!" }));
                    break;
                }
            }
        })
    });

    wsServer.on('listening', () => {
        console.log(`WebSocket server listening on ws://127.0.0.1:${config.port}`);
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
})