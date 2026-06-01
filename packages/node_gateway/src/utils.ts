import { APIKey } from "./db";
import crypto from "node:crypto";

const hashApiKey = (apiKey: string) => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export const isClientVerified = async (apiKey: string) => {
    const apiKeyHash = hashApiKey(apiKey);

    const validKey = await APIKey.findOne({
        keyHash: apiKeyHash,
    });

    if (!validKey) {
        return false;
    }

    if (validKey.revoked) {
        return false;
    }

    return true;
}