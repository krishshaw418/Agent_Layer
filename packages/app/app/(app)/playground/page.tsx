import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaygroundClient } from "@/components/playground/playground-client";

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <Badge>Integrated Playground</Badge>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold text-white">Test chat and embeddings against Agent Layer</h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-300">
            Use your API key, choose a routing strategy, and inspect streaming output, token usage, and heuristic cost estimates in one place.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Network-aware testing</CardTitle>
            <CardDescription>
              Chat requests use a create-job flow followed by direct WebSocket streaming. Embeddings execute through the SDK-backed server route and return structured vectors.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      <PlaygroundClient />
    </div>
  );
}
