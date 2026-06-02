import { decodeEventLog } from "viem";
import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import dotenv from "dotenv";
import { sendMessageToGateway } from "@/utils/ws";
dotenv.config();

const WEBHOOK_SECRET = process.env.APP_WEBHOOK_SECRET!;

const abi = [
  {
    type: "event",
    name: "JobAssigned",
    inputs: [
      {
        name: "jobId",
        type: "string",
        indexed: false
      },
      {
        name: "node",
        type: "address",
        indexed: false
      }
    ]
  }
] as const;


// export async function POST(request: Request) {
//   try {
//     // get webhook secret from headers
//     const webhookSecret = request.headers.get("X-Webhook-Secret")?.trim();

//     if (!webhookSecret || webhookSecret !== WEBHOOK_SECRET) {
//       console.log("Invalid webhook secret:", webhookSecret);
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await request.json();

//     const { jobId, nodeId } = body;

//     if (!jobId || !nodeId) {
//       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
//     }

//     console.log(`Received job assignment notification for jobId: ${jobId}, nodeId: ${nodeId}`);

//     sendMessageToGateway({
//       event: "assign-job",
//       data: {
//         nodeId: nodeId,
//         jobId: jobId
//       }
//     });

//     return NextResponse.json({ message: "Job assignment published successfully" }, { status: 200 });
//   } catch (error) {
//     console.log("Error in publishing job assignment on pubsub:", error);
//     return NextResponse.json({ error: "An error occurred" }, { status: 500 });
//   }
// }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Webhook body received:", JSON.stringify(body, null, 2));
    const logs = body.event?.data?.block?.logs;

    if (!logs?.length) {
      console.log("No matching logs");
      return Response.json({ ok: true });
    }

    const log = logs[0];
    console.log("log: ", log);

    const decoded = decodeEventLog({
      abi,
      data: log.data,
      topics: log.topics
    });

    if (!decoded) {
      console.log("Decoded: failed ", decoded);
      return NextResponse.json({ message: "Decoded failed" }, { status: 400 });
    }

    const jobId = decoded.args?.jobId as string | undefined;
    const nodeId = decoded.args?.node as string | undefined;

    if (!jobId || !nodeId) {
      return NextResponse.json({ message: "Invalid decoded args" }, { status: 400 });
    }

    console.log(`Received job assignment notification for jobId: ${jobId}, nodeId: ${nodeId}`);

    sendMessageToGateway({
      event: "assign-job",
      data: {
        nodeId: nodeId,
        jobId: jobId
      }
    });

    return NextResponse.json({ message: "Job assignment published successfully" }, { status: 200 });
  } catch (error) {
    console.log("Error in publishing job assignment on gateway:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
