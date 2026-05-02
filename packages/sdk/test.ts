import { AgentLayerClient } from "./core/client";

const agentLayerClient = new AgentLayerClient(
  "sk_e1a6fc386c6c7564a83db825a87090c5d3586bd3c3fc69811ce9e9e134972366",
  "https://decidable-bridged-spotting.ngrok-free.dev/api",
);

async function test() {
  const metadata = {
    userId: "0x3C940925C733200DC41A390C070131929aC47D53",
  };

  const stream = await agentLayerClient.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant" },
      { role: "user", content: "Summarize this text: [your text here]" },
    ],
    max_tokens: 1000,
    temperature: 0.2,
    stream: true, // toggle this
    metadata,
    strategy: "balanced",
  });

  // ✅ STREAM MODE
  if (typeof stream[Symbol.asyncIterator] === "function") {
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
  }

  // ✅ NON-STREAM MODE
  console.log(stream);
}

test().catch((err) => {
  console.error("Error during test:", err);
});
