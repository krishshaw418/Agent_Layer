import WebSocket from "ws";

const wsUrl = process.env.GATEWAY_SERVER_URL || "ws://localhost:4000";

const ws = new WebSocket(wsUrl, {
  headers: {
    Authorization: `Bearer ${process.env.GATEWAY_API_KEY}`,
  },
});

ws.on("open", () => {
  console.log("WebSocket connection established with gateway server");
});

ws.on("error", (error: any) => {
  console.error("WebSocket error:", error);
});

export const sendMessageToGateway = (message: any) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log("Sent message to gateway server:", message);
  } else {
    console.error(
      "WebSocket connection is not open. Failed to send message:",
      message,
    );
  }
};
