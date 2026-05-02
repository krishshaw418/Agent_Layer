import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaygroundClient } from "@/components/playground/playground-client";

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PlaygroundClient />
    </div>
  );
}
