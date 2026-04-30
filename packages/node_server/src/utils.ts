import type { Bid } from "node";
import { contractWithSigner } from "./contract";
import { config } from "./config";
import axios from "axios";

// Function to submit the bid on chain
export const submitBid = async (bid: Bid) => {

    try {

        // Save bid on db
        const response = await axios.post<string>(`${config.node_url}/api/node/bid/place-bid`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.node_api_key}`
            },
            body: {
                ...bid,
                jobId: bid.job_id,
                nodePublicKey: config.public_key,
                placedAt: bid.placed_at,
                timeRequired: bid.time_requires
            }
        });

        const bid_id = response.data;

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
    } catch (error) {
        console.error(error);
        return;
    }
}

// Function to stream LLM response to the user
export const submitResult = async (response: Response) => {
    // logic for response streaming
    console.log(response);
    return;
}