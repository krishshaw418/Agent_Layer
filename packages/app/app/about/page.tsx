import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "What is Agent Layer",
    description:
      "Agent Layer is a decentralized AI infrastructure network that accepts AI API requests, routes them across distributed nodes, and returns model outputs through a unified developer surface."
  },
  {
    title: "Vision",
    description:
      "The long-term goal is to make AI execution more open, more fault tolerant, and less dependent on any single inference vendor or compute operator."
  },
  {
    title: "How it works",
    description:
      "Requests enter the network, a scheduler picks nodes based on strategy and availability, nodes execute work, and Vault + Escrow coordinate payment settlement."
  },
  {
    title: "Why it matters",
    description:
      "Developers get resilient routing and more pricing flexibility, while providers can supply capacity directly into a programmable network."
  }
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <Badge>About Agent Layer</Badge>
        <h1 className="font-[var(--font-display)] text-4xl font-semibold text-white">Decentralized AI infrastructure with developer-grade ergonomics</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-300">
          Agent Layer is designed to make networked AI execution feel as simple as a single API client, while preserving the benefits of distributed supply, token settlement, and strategy-aware routing.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  );
}

