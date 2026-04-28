import { ethers } from "ethers";
import { AgentLayerClient } from "../core/client";
import axios from "axios";

export class AccountResource {
  constructor(private client: AgentLayerClient) {}

  async balance(): Promise<{
    raw: bigint;
    formatted: string;
  }> {
    if (!this.client.apiKey) {
      throw new Error("API key is required");
    }

    if (!this.client.baseUrl) {
      throw new Error("Base URL is required");
    }

    try {
      const response = await axios.get(
        `${this.client.baseUrl}/account/balance`,
        {
          headers: {
            Authorization: `Bearer ${this.client.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = response.data;

      if (data.error) {
        throw new Error(
          data.error.message || "Account balance request failed"
        );
      }

      return data.balance;
    } catch (err: any) {
      throw new Error(
        err?.response?.data?.error?.message ||
        err.message ||
        "Unknown error in account.balance"
      );
    }
  }
}