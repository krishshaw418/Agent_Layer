import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const nodeSections = [
  {
    title: "What is a node?",
    description:
      "A node is a compute participant in Agent Layer that accepts routed workloads from the network and executes supported AI jobs."
  },
  {
    title: "Why run a node?",
    description:
      "Node providers supply inference capacity, help decentralize the network, and earn for successful execution."
  },
  {
    title: "Requirements",
    description:
      "Reliable connectivity, supported model runtimes, monitored GPU or CPU resources, and a funded operational wallet."
  },
  {
    title: "Setup guide",
    description:
      "A full bootstrap flow is coming soon. This section will eventually include installation, registration, health checks, and payout configuration."
  }
];

export default function NodePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <Badge>Provider Network</Badge>
        <h1 className="font-[var(--font-display)] text-4xl font-semibold text-white">Run a Node on Agent Layer</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-300">
          Join the decentralized execution layer behind Agent Layer. Provider onboarding documentation is still evolving, but the path is clear: supply reliable compute, register into the network, and serve routed jobs.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {nodeSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card className="border-emerald-400/20 bg-emerald-400/10">
        <CardHeader>
          <CardTitle className="text-emerald-100">Coming soon</CardTitle>
          <CardDescription className="text-emerald-50/80">
            Expect provider docs for node registration, runtime compatibility, payout settlement, and operational best practices.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
