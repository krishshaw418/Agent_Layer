import WebSocket from "ws";

const wsUrl = process.env.GATEWAY_SERVER_URL || "ws://localhost:4000";

const ws = new WebSocket(wsUrl, {
  headers: {
    Authorization: `Bearer ${process.env.GATEWAY_API_KEY}`,
  },
});

// A queue to store messages while the connection is not yet open
const messageQueue: any[] = [];

ws.on("open", () => {
  console.log("WebSocket connection established with gateway server");
  // Flush any queued messages
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    try {
      ws.send(JSON.stringify(msg));
      console.log("Sent queued message to gateway server:", msg);
    } catch (error) {
      console.error("Failed to send queued message:", msg, error);
    }
  }
});

ws.on("error", (error: any) => {
  console.error("WebSocket error:", error);
});

export const sendMessageToGateway = (message: any) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log("Sent message to gateway server:", message);
  } else if (ws.readyState === WebSocket.CONNECTING) {
    console.log("WebSocket connection is establishing. Queueing message:", message);
    messageQueue.push(message);
  } else {
    console.error(
      "WebSocket connection is not open. Failed to send message:",
      message,
    );
  }
};
