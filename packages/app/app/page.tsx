import type { ReactNode } from "react";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Cable,
  CheckCircle2,
  Cpu,
  Globe2,
  Play,
  ShieldCheck,
  Sparkles
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletAuthButton } from "@/components/home/wallet-auth-button";
import { architectureSteps, featureCards } from "@/lib/site";

const heroMetrics = [
  { label: "Deployment model", value: "Network-native" },
  { label: "Developer surface", value: "Docs, SDK, Playground" },
  { label: "Core focus", value: "Reliable AI execution" }
];

const proofPoints = [
  "Unified SDK for chat, embeddings, and account surfaces",
  "Strategy-aware routing without exposing backend complexity",
  "Streaming outputs and predictable token usage workflows"
];

const sections = [
  {
    href: "/docs",
    eyebrow: "Documentation",
    title: "Read the platform guide",
    description: "Start with core concepts, authentication, API references, and SDK workflows.",
    icon: <BookOpen className="h-5 w-5" />
  },
  {
    href: "/playground",
    eyebrow: "Playground",
    title: "Test real requests",
    description: "Try chat and embeddings flows with live responses, request settings, and usage feedback.",
    icon: <Play className="h-5 w-5" />
  },
  {
    href: "/node",
    eyebrow: "Providers",
    title: "Explore node operations",
    description: "Review how providers participate in the network and prepare infrastructure to serve workloads.",
    icon: <Cpu className="h-5 w-5" />
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
              <span className="font-semibold">AL</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Agent Layer</p>
              <p className="text-sm font-medium text-white">AI Infrastructure</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="/docs" className="transition hover:text-white">
              Docs
            </Link>
            <Link href="/playground" className="transition hover:text-white">
              Playground
            </Link>
            <Link href="/node" className="transition hover:text-white">
              Run a Node
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/docs">View Docs</Link>
            </Button>
            <Button asChild size="sm" className="shadow-[0_12px_36px_rgba(34,211,238,0.22)]">
              <Link href="/playground">
                Open Playground
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(8,15,30,0.72))] px-6 py-8 shadow-[0_40px_120px_rgba(15,23,42,0.45)] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(56,189,248,0.18),transparent_24%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:items-center">
            <div className="space-y-7">
              <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                Modern AI Infrastructure
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-4xl font-[var(--font-display)] text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                  Build AI products on infrastructure designed for control, speed, and scale.
                </h1>
                <p className="max-w-2xl text-balance text-lg leading-8 text-slate-300">
                  Agent Layer gives teams a cleaner way to ship AI-powered experiences with a unified platform for routing, streaming, and operational visibility.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <WalletAuthButton />
                <Button asChild variant="outline" size="lg" className="border-white/15 bg-white/[0.04]">
                  <Link href="/docs">
                    Start with Docs
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                {heroMetrics.map((metric) => (
                  <MetricCard key={metric.label} label={metric.label} value={metric.value} />
                ))}
              </div>
            </div>

            <Card className="border-white/10 bg-slate-950/65 shadow-[0_24px_80px_rgba(15,23,42,0.55)]">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-100">
                    Platform Snapshot
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                    Production-minded
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">Operationally simpler AI delivery</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Use one platform surface to move from implementation to testing and rollout.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                      <Globe2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {proofPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <p className="text-sm leading-6 text-slate-300">{point}</p>
                  </div>
                ))}
                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniStat title="Docs-first onboarding" description="Clear path from introduction to implementation." />
                  <MiniStat title="Live testing" description="Validate flows before integrating into your app." />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="h-full border-white/10 bg-white/[0.03]">
                <CardHeader className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader className="space-y-4">
              <Badge>Why Teams Choose It</Badge>
              <CardTitle className="max-w-xl text-3xl">A cleaner platform surface for shipping AI features.</CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7">
                Agent Layer combines platform guidance, live testing, and network-aware infrastructure into a product experience that feels cohesive from the first visit.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <InfoRow
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Operational clarity"
                description="Keep docs, testing, and platform concepts aligned so teams can onboard faster."
              />
              <InfoRow
                icon={<Cable className="h-4 w-4" />}
                title="Flexible execution"
                description="Route requests through the network without turning your product copy into a systems diagram."
              />
              <InfoRow
                icon={<Sparkles className="h-4 w-4" />}
                title="Modern developer experience"
                description="Give new users clear entry points, then progressively reveal the deeper technical model."
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            {sections.map((section) => (
              <LaunchCard
                key={section.href}
                href={section.href}
                eyebrow={section.eyebrow}
                title={section.title}
                description={section.description}
                icon={section.icon}
              />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge>Platform Flow</Badge>
              <h2 className="font-[var(--font-display)] text-3xl font-semibold text-white">
                A concise view of how the platform works
              </h2>
              <p className="max-w-3xl text-base leading-7 text-slate-400">
                Enough detail to establish trust and product direction, without forcing architecture diagrams into the first screen.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {architectureSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <Card key={step.title} className="h-full border-white/10 bg-white/[0.03]">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Step {index + 1}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <CardTitle>{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,30,0.88),rgba(7,16,35,0.72))]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-10 lg:py-10">
            <div className="space-y-4">
              <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">Get Started</Badge>
              <h2 className="font-[var(--font-display)] text-3xl font-semibold text-white">
                Start with the docs, validate in the playground, then move into production.
              </h2>
              <p className="max-w-3xl text-base leading-7 text-slate-300">
                Move from onboarding to hands-on testing with a flow designed for developer teams evaluating the platform seriously.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/docs/getting-started">
                  Open Getting Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/15 bg-white/[0.04]">
                <Link href="/playground">
                  Launch Playground
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

function MiniStat({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function LaunchCard({
  href,
  icon,
  eyebrow,
  title,
  description
}: {
  href: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="h-full border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="w-fit px-0">
          <Link href={href}>
            Open section
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
    </Card>
  );
}
