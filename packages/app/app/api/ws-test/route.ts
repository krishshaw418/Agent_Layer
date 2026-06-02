export const runtime = "nodejs";

import WebSocket from "ws";

export async function GET() {
  return new Promise<Response>((resolve) => {
    const ws = new WebSocket(
      "wss://api.node-gateway.amethsyt.xyz?type=user",
      {
        headers: {
          Authorization: `Bearer ${process.env.GATEWAY_API_KEY}`,
        },
      }
    );

    const sendMessageToGateway = (message: any) => {
      console.log("readyState:", ws.readyState);
      console.log("OPEN:", WebSocket.OPEN);

      try {
        if (ws.readyState === WebSocket.OPEN) {
          console.log("about to send");

          ws.send(JSON.stringify(message));

          console.log("send success");
          console.log("Sent message to gateway server:", message);
        } else {
          console.error(
            "WebSocket connection is not open. Failed to send message:",
            message,
          );
        }
      } catch (err) {
        console.error("SEND ERROR:", err);
      }
    };

    ws.on("open", () => {
      console.log("OPEN");

      try {
        sendMessageToGateway({
          event: "test-event",
          data: {
            message: "Hello from Next.js API route!",
            timestamp: new Date().toISOString(),
          },
        });

        console.log("SEND SUCCESS");

        resolve(
          Response.json({
            success: true,
            message: "send succeeded",
          })
        );
      } catch (err) {
        console.error("SEND FAILED", err);

        resolve(
          Response.json({
            success: false,
            error: String(err),
          })
        );
      }
    });

    ws.on("message", (data) => {
      console.log("MESSAGE", data.toString());
    });

    ws.on("close", (code, reason) => {
      console.log("CLOSE", code, reason.toString());
    });

    ws.on("error", (err) => {
      console.error("ERROR", err);

      resolve(
        Response.json({
          success: false,
          error: String(err),
        })
      );
    });
  });
}