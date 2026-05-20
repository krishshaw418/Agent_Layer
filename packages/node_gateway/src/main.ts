import { createWebSocketServer } from "./server";
import { config } from "./config";
import { User, Node } from "./registry";
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
        let user: User;
        let node: Node;

        if (type === "user") {
            client.id = uuidv4();
            user = new User(client.id);
            console.log(`User Connected: ${client.id}`);
        } else if (type === "node") {
            const nodeId = searchParams.get('nodeId');
            if (!nodeId) {
                console.error("Missing nodeId!");
                return ws.send(JSON.stringify({ event: "err", data: "Missing nodeId query params!" }));;
            }
            client.id = uuidv4();
            node = new Node(client.id, nodeId);
            console.log(`Node connected: ${client.id}`);
        } else {
            client.send(JSON.stringify({ event: "err", data: "Invalid client type!" }));
            return;
        }

        client.on('error', (err) => {
            console.error(err);
        });

        client.on('close', () => {
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
                    user.createJob(jobId); // Update in-memory registry

                    console.log(`Jobs posted by ${user._socketId}: \n`, user.getJobs());
                    client.send(JSON.stringify({ event: "ack", data: `Job Id: ${jobId} pusblished!` }));

                    wsServer.clients.forEach((c) => {
                        if (c !== client && c.readyState === WebSocket.OPEN) {
                            c.send(JSON.stringify({ event: "jobs", data: msg.data }));
                        }
                    }) // broadcast the job to the listeners
                    break;
                }
                case "assign-job": {
                    const nodeId = msg.data.nodeId;
                    const jobId = msg.data.jobId;
                    if (!nodeId) {
                        console.error("Missing nodeId in assgin_job event data!");
                        return;
                    }

                    if (node._nodeId === nodeId) {
                        node.assignedJobs(jobId);
                        console.log(`Jobs assigned to ${node._nodeId} \n:`, node.getJobs());
                    }

                    wsServer.clients.forEach((c) => {
                        if (c !== client && c.readyState === WebSocket.OPEN) {
                            c.send(JSON.stringify({ event: "assigned-job", data: msg.data }));
                        }
                    }) // broadcast the job to the listeners
                    break;
                }
                case "stream-response": {
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