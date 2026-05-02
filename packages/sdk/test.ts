import { AgentLayerClient } from "./core/client";

const agentLayerClient = new AgentLayerClient(
  "sk_e1a6fc386c6c7564a83db825a87090c5d3586bd3c3fc69811ce9e9e134972366",
  "https://decidable-bridged-spotting.ngrok-free.dev/api",
);

async function test() {
  const metadata = {
    userId: "0x3C940925C733200DC41A390C070131929aC47D53",
  };

  const text = "Artificial Intelligence (AI) has rapidly transformed various industries over the past decade. From healthcare to finance, AI systems are being used to automate tasks, improve decision-making, and enhance user experiences. Machine learning, a subset of AI, enables systems to learn from data and improve over time without explicit programming. Deep learning, a more advanced form of machine learning, uses neural networks to process complex patterns in large datasets. Despite its advantages, AI also raises ethical concerns, including data privacy, job displacement, and algorithmic bias. Governments and organizations are working to establish guidelines and regulations to ensure responsible AI development and deployment. As AI continues to evolve, it is expected to play an even more significant role in shaping the future of technology and society."

  const stream = await agentLayerClient.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant" },
      { role: "user", content: `Summarize this text: ${text}` },
    ],
    max_tokens: 1000,
    temperature: 0.2,
    stream: true,
    metadata,
    strategy: "balanced",
  });

  if (typeof stream[Symbol.asyncIterator] === "function") {
    console.log("Streaming response:\n");
    let buffer = "";

    for await (const chunk of stream) {
      const content = chunk?.choices?.[0]?.delta?.content || "";
      buffer += content;

      if (/[ \n.,!?]$/.test(content)) {
        process.stdout.write(buffer);
        buffer = "";
      }
    }

    if (buffer) process.stdout.write(buffer);
    process.stdout.write("\n");
    process.exit(0);
  }
}

test().catch((err) => {
  console.error("Error during test:", err);
  process.exit(1);
});
