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