import { WebSocketServer } from "ws";
import { config } from "./config";

export const createWebSocketServer = () => {
    const wsServer = new WebSocketServer({
        host: '127.0.0.1',
        port: config.port
    });

    return wsServer;
}