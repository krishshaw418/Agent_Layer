const wsUrl = process.env.GATEWAY_SERVER_URL || "ws://localhost:4000";
const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log("WebSocket connection established with gateway server");
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

export const sendMessageToGateway = (message: any) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log("Sent message to gateway server:", message);
  } else {
    console.error("WebSocket connection is not open. Failed to send message:", message);
  }
}