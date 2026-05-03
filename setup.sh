#!/bin/bash

set -e

# ─────────────────────────────────────────
#  Config Setup Script
# ─────────────────────────────────────────

REPO_URL="https://github.com/krishshaw418/Agent_Layer"
SPARSE_PATH="packages/node_server"
TARGET_DIR="Agent_Layer_Node"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         Node Configuration Setup     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Sparse checkout — only packages/node_server
echo "📦 Fetching node_server only (sparse checkout)..."

if [ -d "$TARGET_DIR" ]; then
  echo "  ⚠️  Directory '$TARGET_DIR' already exists. Skipping fetch."
else
  # Clone with no files, then sparse-checkout just the node_server subfolder
  git clone --no-checkout --depth=1 --filter=blob:none "$REPO_URL" .tmp_sparse
  git -C .tmp_sparse sparse-checkout init --cone
  git -C .tmp_sparse sparse-checkout set "$SPARSE_PATH"
  git -C .tmp_sparse checkout

  # Move just the node_server folder out, discard the rest
  mv ".tmp_sparse/$SPARSE_PATH" "$TARGET_DIR"
  rm -rf .tmp_sparse
fi

echo "✅ node_server ready."
echo ""

# Navigate into node_server
cd "$TARGET_DIR"
echo "📂 Working directory: $(pwd)"
echo ""

MANUAL_CONFIG="manual.config.json"
DEFAULT_CONFIG="default.config.json"

# Write default.config.json
echo "📄 Writing default.config.json..."
cat > "$DEFAULT_CONFIG" <<'EOF'
{
  "PORT": 8080,
  "NEW_JOBS_CHANNEL": "new-jobs-channel",
  "JOB_ASSIGN_CHANNEL": "job-assignment-channel",
  "CONTRACT_ADDRESS": "0x86f4089F7726dc0b4Cfe9B2540A81b12355e6FFa",
  "OLLAMA_HOST": "127.0.0.1",
  "OLLAMA_PORT": 11434
}
EOF
echo "✅ default.config.json written."
echo ""

# Collect manual config values
echo "🔧 Please provide values for manual.config.json:"
echo ""

read -rp "  UPSTASH_REDIS_URL  (Upstash Redis URL)          : " UPSTASH_REDIS_URL
read -rp "  BASE_RPC_URL       (Alchemy RPC URL)            : " BASE_RPC_URL
read -rp "  NODE_QUERY_URL     (Node URL for querying DB)   : " NODE_QUERY_URL
read -rp "  NODE_API_KEY       (Node API key)               : " NODE_API_KEY
read -rsp "  PRIVATE_KEY        (Your private key)           : " PRIVATE_KEY
echo ""
read -rp "  PUBLIC_ADDRESS     (Your public address)        : " PUBLIC_ADDRESS
read -rp "  MODEL              (Model name your machine supports): " MODEL

echo ""

# Write manual.config.json
echo "📄 Writing manual.config.json..."
cat > "$MANUAL_CONFIG" << EOF
{
    "UPSTASH_REDIS_URL": "$UPSTASH_REDIS_URL",
    "BASE_RPC_URL": "$BASE_RPC_URL",
    "NODE_QUERY_URL": "$NODE_QUERY_URL",
    "NODE_API_KEY": "$NODE_API_KEY",
    "PRIVATE_KEY": "$PRIVATE_KEY",
    "PUBLIC_ADDRESS": "$PUBLIC_ADDRESS",
    "MODEL": "$MODEL"
}
EOF
echo "✅ manual.config.json written."
echo ""

# Summary
echo "╔══════════════════════════════════════╗"
echo "║           Setup Complete ✓           ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "  Files created inside Agent_Layer/:"
echo "    • $DEFAULT_CONFIG"
echo "    • $MANUAL_CONFIG"
echo ""
echo "  ⚠️  Keep manual.config.json private — it contains your private key."
echo ""