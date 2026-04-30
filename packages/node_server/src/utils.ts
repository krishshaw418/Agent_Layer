import type { Bid } from "node";
import { contractWithSigner } from "./contract";
import { db } from "./db";
import { config } from "./config";

// Function to submit the bid on chain
export const submitBid = async (bid: Bid) => {

    try {

        // First store the bid on db
        const new_bid = await db.collection('Bid').insertOne({
            ...bid,
            jobId: bid.job_id,
            nodePublicKey: config.node_add,
            placedAt: bid.placed_at,
            timeRequired: bid.time_requires
        });

        // Then place the bid on chain
        const txnResp = await contractWithSigner.placeBid(
            new_bid.insertedId.toString(),
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