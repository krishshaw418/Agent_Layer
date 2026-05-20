import { createWebSocketServer } from "./server";
import { config } from "./config";
import { nodeJobRegistry, userJobRegistry } from "./registry";
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

    wsServer.on('connection', (ws) => {

        const client = ws as IdentifiedWebSocket;
        client.id = uuidv4();
        console.log("User connected!");

        client.on('error', (err) => {
            console.error(err);
        });

        client.on('close', () => {
            userJobRegistry.popRecord(client.id);
            console.log(`User ${client.id} disconnected!`); // removing disconnected user's request
        });

        client.on('message', (data, _isBinary) => {
            console.log(JSON.parse(data.toString()));
            const parsed = msgSchema.safeParse(JSON.parse(data.toString()));

            if (!parsed.success) {
                client.send(`Error: ${parsed.error}`);
                return;
            }

            const msg = parsed.data;

            switch (msg.event) {
                case "new-job": {
                    const socketId = client.id;
                    const jobId = msg.data.jobId;
                    userJobRegistry.pushRecord(socketId, jobId); // Update in-memory registry

                    console.log(userJobRegistry.getRecords());
                    client.send(JSON.stringify({ event: "ack", data: `Job Id: ${jobId} pusblished!` }));

                    wsServer.clients.forEach((c) => {
                        if (c !== client && c.readyState === WebSocket.OPEN) {
                            c.send(JSON.stringify({ event: "jobs", data: msg.data }));
                        }
                    }) // broadcast the job to the listeners
                    break;
                }
                case "job_assign": {
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