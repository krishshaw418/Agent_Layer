import WebSocket from "ws";
import { config } from "./config";

class WsInstance {

  private static instance: WebSocket | null = null;

  public static getInstance(): WebSocket {
    if (!this.instance || this.instance.readyState === WebSocket.CLOSED) {
      this.instance = new WebSocket(`ws://127.0.0.1:8080?type=node&nodeId=${config.public_key}`);
    }
    return this.instance;
  }

  public static send(event: string, data: unknown) {
    const ws = this.getInstance();

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    } else {
      ws.once("open", () => {
        ws.send(JSON.stringify({ event, data }));
      });
    }
  }
}

export const ws = WsInstance.getInstance();
export const wsSend = WsInstance.send.bind(WsInstance);