# Agent Layer Node Setup Guide

This guide walks you through downloading and running `setup.sh` to set up your Agent Layer node, and how to obtain all required credentials.

---

## Prerequisites

Before running the setup script, make sure you have the following installed:

- **Git** — [https://git-scm.com/downloads](https://git-scm.com/downloads)
- **Bun v1.3.6** — Install via:
  ```bash
  curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.6"
  ```
  Verify with:
  ```bash
  bun --version  # should output 1.3.6
  ```
- **Ollama** — [https://ollama.com/download](https://ollama.com/download) — required to run LLM models locally

---

## Step 1 — Download & Run setup.sh

1. Download `setup.sh` from [agentlayerai.vercel.app](https://agentlayerai.vercel.app/)

2. Open a terminal in the folder where you downloaded it

3. Make it executable and run it:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

The script will:
- Clone the `node_server` into a local `Agent_Layer/` directory
- Write `default.config.json` automatically
- Prompt you to enter the values for `manual.config.json` one by one

---

## Step 2 — Obtaining Your Credentials

The script will ask for the following values. Here's where to get each one:

---

### `PRIVATE_KEY` & `PUBLIC_ADDRESS` — BASE Chain Wallet

You need a wallet on the **BASE blockchain** (an Ethereum L2).

1. Install [MetaMask](https://metamask.io/) or any EVM-compatible wallet
2. Create a new wallet or import an existing one
3. Switch the network to **Base Mainnet**
4. Your **public address** is the `0x...` address shown in your wallet — this is your `PUBLIC_ADDRESS`
5. Export your **private key** from your wallet settings — this is your `PRIVATE_KEY`

> ⚠️ **Never share your private key with anyone.** Keep `manual.config.json` out of version control (add it to `.gitignore`).

---

### `BASE_RPC_URL` — RPC Provider (Alchemy)

An RPC URL lets your node communicate with the BASE blockchain.

1. Go to [https://www.alchemy.com](https://www.alchemy.com) and create a free account
2. Click **Create App**
3. Select **Base** as the network and **Base Mainnet** as the chain
4. Once created, open the app and copy the **HTTPS** endpoint URL
5. Paste it as your `BASE_RPC_URL`

Example format:
```
https://base-mainnet.g.alchemy.com/v2/your-api-key
```

---

### `NODE_QUERY_URL` — Agent Layer Query Endpoint

This is fixed — use the following URL:

```
https://agentlayerai.vercel.app
```

---

### `NODE_API_KEY` — Agent Layer API Key

1. Visit [https://agentlayerai.vercel.app/](https://agentlayerai.vercel.app/)
2. Connect your BASE wallet
3. Authenticate yourself through the site
4. Your API key will be displayed — copy it as your `NODE_API_KEY`

---

### `MODEL` — Ollama LLM Model Name

This is the name of the LLM model you'll run locally via Ollama. Choose a model your machine can support.

Common options:

| Model | RAM Required |
|-------|-------------|
| `llama3.2:1b` | ~2 GB |
| `llama3.2:3b` | ~4 GB |
| `llama3.1:8b` | ~8 GB |
| `mistral:7b` | ~8 GB |
| `llama3.1:70b` | ~40 GB |

Pull your chosen model before running the node:
```bash
ollama pull llama3.2:3b
```

Then set `MODEL` to the model name, e.g. `llama3.2:3b`.

Browse all available models at [https://ollama.com/library](https://ollama.com/library).

---

## Step 3 — Server Starts Automatically

Once all credentials are entered, the script will automatically start the node server by running:

```bash
bun install
bun dev
```

You should see the server come online on **port 8080**. Keep this terminal window open — closing it will stop the node.

To restart the server manually at any time:
```bash
cd Agent_Layer
bun install
bun dev
```

---

## What Gets Created

After the script completes, your `Agent_Layer/` directory will contain:

```
Agent_Layer/
├── default.config.json    ← auto-generated, no changes needed
├── manual.config.json     ← your credentials (keep this private!)
└── ... (node_server files)
```

---

## Troubleshooting

**`permission denied` when running setup.sh**
```bash
chmod +x setup.sh
```

**`git` not found**
Install Git from [https://git-scm.com/downloads](https://git-scm.com/downloads)

**`bun` not found after install**
Restart your terminal or run `source ~/.bashrc` (Linux/Mac)

**Ollama model not running**
Make sure Ollama is running in the background:
```bash
ollama serve
```

---

## Support

For help, visit [https://agentlayerai.vercel.app/](https://agentlayerai.vercel.app/) or open an issue on the repository.