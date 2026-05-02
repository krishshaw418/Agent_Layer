import type { Bid } from "node";
import { contractWithSigner } from "./contract";
import { config } from "./config";
import axios from "axios";

// Function to submit the bid on chain
export const submitBid = async (bid: Bid) => {
  try {
    // Save bid on db
    const response = await axios.post<any>(
      `${config.node_url}/api/node/bid/place-bid`,
      {
        ...bid,
        jobId: bid.job_id,
        nodePublicKey: config.public_key,
        placedAt: bid.placed_at,
        timeRequired: bid.time_requires,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.node_api_key}`,
        },
      },
    );

    // Generated bid
    const bid_id = response.data.bidId as string;

    console.log("bid: ", bid);

    // Then place the bid on chain
    const txnResp = await contractWithSigner.placeBid(
      bid_id,
      bid.token,
      bid.job_id,
      bid.placed_at,
      bid.time_requires,
    );

    // Log transaction hash
    console.log("txn_hash: ", txnResp.hash);

    // Log block number
    const receipt = await txnResp.wait();
    console.log("confirmed in block:", receipt?.blockNumber);

    return;
  } catch (error: any) {
    if (error.response) {
      // Server responded with non-2xx
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);

      if (error.response.status === 401) {
        console.error("Unauthorized:", error.response.data.error);
      }
    } else if (error.request) {
      // No response received
      console.error("No response:", error.request);
    } else {
      // Something else
      console.error("Error:", error.message);
    }
    return;
  }
};
