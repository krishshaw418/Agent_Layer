import { Code } from "lucide-react";
import { CopyableCode } from "@/components/copyable-code";

export default function SdkDocsPage() {
  const initCode = `import { AgentLayerClient } from "@agentlayer/sdk";

const client = new AgentLayerClient("YOUR_API_KEY");`;

  const chatCode = `const response = await client.chat.completions.create({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "How does decentralization work?" }
  ],
  strategy: "balanced", // 'latency' | 'cost' | 'balanced'
  stream: false // set to true to stream response
});

console.log(response);`;

  const embeddingCode = `const response = await client.embeddings.create({
  model: "agent-embed-1",
  input: [
    "Agent Layer is a decentralized AI network.",
    "Tokens are used to execute workloads."
  ]
});

console.log(response.data);
// Output: [{ embedding: [0.12, 0.54, ...], index: 0 }, ... ]`;

  const accountCode = `const balance = await client.account.balance();

console.log(\`Raw Balance: \${balance.raw}\`);
console.log(\`Formatted Balance: \${balance.formatted}\`);`;

  const tokenCode = `const estimation = client.token.estimate({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Explain quantum computing." }
  ],
  max_tokens: 100 // optional constraint
});

console.log(\`Prompt Tokens: \${estimation.prompt_tokens}\`);
console.log(\`Total Estimated Tokens: \${estimation.total_tokens}\`);`;

  return (
    <div className="min-h-screen bg-transparent pb-24 font-sans text-black">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12 border-b-[4px] border-black pb-8">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-black mb-4">
            Agent Layer SDK
          </h1>
          <p className="text-xl font-bold text-gray-700">
            A comprehensive guide to using the Agent Layer SDK for interacting with the decentralized AI infrastructure.
          </p>
        </header>

        <div className="space-y-16">
          {/* Initialize Client */}
          <section id="initialize-client" className="scroll-mt-8">
            <h2 className="text-3xl font-black uppercase mb-4 text-black pb-2 border-b-[3px] border-black">
              Initialize Client
            </h2>
            <p className="text-lg font-bold text-gray-700 mb-4">
              Before using any of the SDK methods, you must initialize the <code className="bg-gray-200 px-2 py-1 font-mono text-sm border-[2px] border-black">AgentLayerClient</code> with your API key. You can instantiate it once and share it throughout your application.
            </p>
            <CopyableCode code={initCode} />
          </section>

          {/* Chat Completions */}
          <section id="chat-completions" className="scroll-mt-8">
            <h2 className="text-3xl font-black uppercase mb-4 text-black pb-2 border-b-[3px] border-black">
              Chat Completions
            </h2>
            <p className="text-lg font-bold text-gray-700 mb-6">
              Generate text and stream responses using the decentralized node network. Supports standard roles and cost/latency strategy optimizations.
            </p>
            
            <h3 className="text-xl font-black uppercase mt-8 mb-4">Parameters</h3>
            <div className="overflow-x-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-[2px] border-black bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-black uppercase">Name</th>
                    <th className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-black uppercase">Type</th>
                    <th className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-black uppercase">Required</th>
                    <th className="border-b-[2px] border-black px-4 py-3 font-black uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white font-medium text-gray-800">
                  <tr>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono font-bold">messages</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono">ChatMessage[]</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 text-center"><span className="text-green-600 font-black">Yes</span></td>
                    <td className="border-b-[2px] border-black px-4 py-3">Array of message objects (role, content) comprising the conversation so far.</td>
                  </tr>
                  <tr>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono font-bold">temperature</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono">number</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 text-center text-gray-500">No</td>
                    <td className="border-b-[2px] border-black px-4 py-3">Sampling temperature. Higher values make output more random.</td>
                  </tr>
                  <tr>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono font-bold">max_tokens</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono">number</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 text-center text-gray-500">No</td>
                    <td className="border-b-[2px] border-black px-4 py-3">Maximum number of tokens to generate in the completion.</td>
                  </tr>
                  <tr>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono font-bold">stream</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono">boolean</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 text-center text-gray-500">No</td>
                    <td className="border-b-[2px] border-black px-4 py-3">If set, partial message deltas will be sent. Response becomes an async generator.</td>
                  </tr>
                  <tr>
                    <td className="border-r-[2px] border-black px-4 py-3 font-mono font-bold">strategy</td>
                    <td className="border-r-[2px] border-black px-4 py-3 font-mono">string</td>
                    <td className="border-r-[2px] border-black px-4 py-3 text-center text-gray-500">No</td>
                    <td className="px-4 py-3">Routing strategy: <code className="bg-gray-200 px-1 border-[1px] border-black">"latency"</code>, <code className="bg-gray-200 px-1 border-[1px] border-black">"cost"</code>, or <code className="bg-gray-200 px-1 border-[1px] border-black">"balanced"</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-black uppercase mt-8 mb-4">Response Schema</h3>
            <p className="mb-2 font-bold text-gray-700">When <code className="bg-gray-200 px-1 font-mono text-sm border-[1px] border-black">stream: false</code>:</p>
            <div className="bg-gray-100 p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-sm mb-6">
              <span className="text-[#7a00ff] font-bold">string</span> // The complete generated text content.
            </div>
            
            <p className="mb-2 font-bold text-gray-700">When <code className="bg-gray-200 px-1 font-mono text-sm border-[1px] border-black">stream: true</code>:</p>
            <div className="bg-gray-100 p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-sm mb-4">
              <span className="text-[#7a00ff] font-bold">AsyncGenerator&lt;Chunk&gt;</span> // Yields chunk objects with <code className="bg-gray-200 px-1 border-[1px] border-black">choices[0].delta.content</code>.
            </div>

            <CopyableCode code={chatCode} />
          </section>

          {/* Embeddings */}
          <section id="embeddings" className="scroll-mt-8">
            <h2 className="text-3xl font-black uppercase mb-4 text-black pb-2 border-b-[3px] border-black">
              Embeddings
            </h2>
            <p className="text-lg font-bold text-gray-700 mb-6">
              Generate high-quality vector representations of text inputs for search, clustering, and retrieval-augmented generation (RAG).
            </p>
            
            <h3 className="text-xl font-black uppercase mt-8 mb-4">Parameters</h3>
            <div className="overflow-x-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-[2px] border-black bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-black uppercase">Name</th>
                    <th className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-black uppercase">Type</th>
                    <th className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-black uppercase">Required</th>
                    <th className="border-b-[2px] border-black px-4 py-3 font-black uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white font-medium text-gray-800">
                  <tr>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono font-bold">input</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono">string[]</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 text-center"><span className="text-green-600 font-black">Yes</span></td>
                    <td className="border-b-[2px] border-black px-4 py-3">Input text to embed. Must be an array of strings.</td>
                  </tr>
                  <tr>
                    <td className="border-r-[2px] border-black px-4 py-3 font-mono font-bold">model</td>
                    <td className="border-r-[2px] border-black px-4 py-3 font-mono">string</td>
                    <td className="border-r-[2px] border-black px-4 py-3 text-center text-gray-500">No</td>
                    <td className="px-4 py-3">The embedding model to use (e.g., <code className="bg-gray-200 px-1 border-[1px] border-black">"agent-embed-1"</code>).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-black uppercase mt-8 mb-4">Response Schema</h3>
            <div className="bg-gray-100 p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-sm mb-4">
<pre>{`{
  object: "list",
  data: [
    {
      embedding: number[], // The vector array
      index: number        // Index of the input string
    }
  ],
  usage?: {
    prompt_tokens: number,
    total_tokens: number
  }
}`}</pre>
            </div>

            <CopyableCode code={embeddingCode} />
          </section>

          {/* Account Balance */}
          <section id="account-balance" className="scroll-mt-8">
            <h2 className="text-3xl font-black uppercase mb-4 text-black pb-2 border-b-[3px] border-black">
              Account Balance
            </h2>
            <p className="text-lg font-bold text-gray-700 mb-6">
              Check your current token balance to ensure you have sufficient funds for executing network workloads.
            </p>
            
            <h3 className="text-xl font-black uppercase mt-8 mb-4">Parameters</h3>
            <p className="text-gray-700 font-bold mb-6">This method does not require any parameters.</p>

            <h3 className="text-xl font-black uppercase mt-8 mb-4">Response Schema</h3>
            <div className="bg-gray-100 p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-sm mb-4">
<pre>{`{
  raw: bigint,        // Raw balance in smallest unit
  formatted: string   // Human-readable balance string
}`}</pre>
            </div>

            <CopyableCode code={accountCode} />
          </section>

          {/* Token Estimation */}
          <section id="token-estimation" className="scroll-mt-8">
            <h2 className="text-3xl font-black uppercase mb-4 text-black pb-2 border-b-[3px] border-black">
              Token Estimation
            </h2>
            <p className="text-lg font-bold text-gray-700 mb-6">
              Estimate the number of tokens a prompt will consume before executing a completion or embedding request.
            </p>
            
            <h3 className="text-xl font-black uppercase mt-8 mb-4">Parameters</h3>
            <div className="overflow-x-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-[2px] border-black bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-black uppercase">Name</th>
                    <th className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-black uppercase">Type</th>
                    <th className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-black uppercase">Required</th>
                    <th className="border-b-[2px] border-black px-4 py-3 font-black uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white font-medium text-gray-800">
                  <tr>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono font-bold">messages</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono">ChatMessage[]</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 text-center text-gray-500">Conditional</td>
                    <td className="border-b-[2px] border-black px-4 py-3">Array of messages. Provide either <code className="bg-gray-200 px-1 border-[1px] border-black">messages</code> OR <code className="bg-gray-200 px-1 border-[1px] border-black">input</code>.</td>
                  </tr>
                  <tr>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono font-bold">input</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 font-mono">string | string[]</td>
                    <td className="border-b-[2px] border-r-[2px] border-black px-4 py-3 text-center text-gray-500">Conditional</td>
                    <td className="border-b-[2px] border-black px-4 py-3">Raw string or array of strings. Provide either <code className="bg-gray-200 px-1 border-[1px] border-black">messages</code> OR <code className="bg-gray-200 px-1 border-[1px] border-black">input</code>.</td>
                  </tr>
                  <tr>
                    <td className="border-r-[2px] border-black px-4 py-3 font-mono font-bold">max_tokens</td>
                    <td className="border-r-[2px] border-black px-4 py-3 font-mono">number</td>
                    <td className="border-r-[2px] border-black px-4 py-3 text-center text-gray-500">No</td>
                    <td className="px-4 py-3">Optional constraint to determine estimated completion tokens.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-black uppercase mt-8 mb-4">Response Schema</h3>
            <div className="bg-gray-100 p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-sm mb-4">
<pre>{`{
  prompt_tokens: number,                 // Tokens consumed by the input
  estimated_completion_tokens?: number,  // Tokens expected for output
  total_tokens: number                   // prompt_tokens + estimated_completion_tokens
}`}</pre>
            </div>

            <CopyableCode code={tokenCode} />
          </section>
        </div>
      </div>
    </div>
  );
}
