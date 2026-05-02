import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, BookOpen, Cable, CheckCircle2, Cpu, Globe2, Play, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletAuthButton } from "@/components/home/wallet-auth-button";
import { architectureSteps, featureCards } from "@/lib/site";

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
    <div className="min-h-screen bg-transparent">
      {/* Header matching the black nav bar in the image */}
      <header className="bg-black text-white py-4 border-b-4 border-[#7a00ff]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/agent_layer_logo.png" alt="Agent Layer" width={30} height={30} className="h-30 w-30 object-contain" />
            <span className="font-black tracking-widest uppercase text-xl">AgentLayer</span>
          </div>

          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-widest text-gray-400 md:flex">
            <Link href="/docs" className="transition hover:text-white">Docs</Link>
            <Link href="/playground" className="transition hover:text-white">Playground</Link>
            <Link href="/node" className="transition hover:text-white">Run a Node</Link>
          </nav>

          <div className="flex items-center gap-4">
            <WalletAuthButton mode="navbar" className="hidden sm:inline-flex border-2 border-white bg-transparent text-white hover:bg-white hover:text-black rounded-none uppercase text-xs font-bold px-6 py-5" />
            <Button asChild className="bg-[#7a00ff] hover:bg-[#6000d6] text-white rounded-none uppercase text-xs font-bold px-6 py-5 border-none">
              <Link href="/playground">Open Playground</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-32">
        {/* Hero Section matching the image */}
        <section className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <h1 className="font-black leading-[0.9] tracking-tighter text-[3rem] sm:text-[4.5rem] lg:text-[4rem] xl:text-[4.5rem] uppercase">
              <span className="block text-black">DECENTRALIZED</span>
              <span className="block text-black">AI</span>
              <span className="block text-[#7a00ff]">INFRA.</span>
            </h1>

            <p className="max-w-md text-xl font-bold leading-relaxed text-gray-800">
              Agent Layer is a DePIN-style infrastructure that allows users to make AI API calls executed by distributed nodes instead of centralized servers.
            </p>

            <div className="pt-4 space-y-4">
              <WalletAuthButton className="bg-black hover:bg-gray-800 text-white rounded-none text-lg font-bold px-10 py-8 uppercase shadow-[6px_6px_0px_0px_rgba(122,0,255,1)] transition-transform hover:translate-y-1 hover:translate-x-1 hover:shadow-none" />
              <p className="text-sm font-mono text-gray-500 font-bold uppercase">
                Trust-minimized • Cheaper AI
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:ml-auto mt-12 lg:mt-0">
            {/* Purple decorative block */}
            <div className="absolute -bottom-8 -right-8 h-40 w-40 bg-[#7a00ff] z-0 hidden sm:block"></div>

            {/* Brutalist Code Card */}
            <div className="border-[3px] border-black bg-white p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10">
              <p className="mb-6 text-sm font-black uppercase tracking-widest text-black">
                INTEGRATE IN MINUTES
              </p>

              <div className="flex flex-col border-[3px] border-black bg-black p-5 text-white font-mono text-sm leading-relaxed overflow-x-auto">
                <p className="text-gray-400 mb-2">{'//'} Initialize the SDK</p>
                <p><span className="text-[#7a00ff]">import</span> &#123; AgentLayer &#125; <span className="text-[#7a00ff]">from</span> <span className="text-green-400">'@agentlayer/sdk'</span>;</p>
                <p className="mt-2"><span className="text-[#7a00ff]">const</span> client = <span className="text-[#7a00ff]">new</span> AgentLayer();</p>
                <p className="mt-4 text-gray-400">{'//'} Route request to network</p>
                <p><span className="text-[#7a00ff]">const</span> res = <span className="text-[#7a00ff]">await</span> client.chat.completions.create(&#123;</p>
                <p>&nbsp;&nbsp;messages: [&#123; role: <span className="text-green-400">'user'</span>, content: <span className="text-green-400">'Hello node!'</span> &#125;],</p>
                <p>&#125;);</p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono font-bold text-gray-500 uppercase">
                <span>SDK READY</span>
                <span>•</span>
                <span>WEBSOCKET STREAMING</span>
                <span>•</span>
                <span>TOKEN ESTIMATION</span>
              </div>
            </div>
          </div>
        </section>

        {/* Adapted Features Section in Brutalist Style */}
        <section className="mt-32 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="h-full border-[3px] border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex h-14 w-14 items-center justify-center bg-black text-white mb-6 border-[3px] border-black">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-black text-xl uppercase mb-3 text-black">{feature.title}</h3>
                <p className="text-gray-700 font-medium">{feature.description}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-24 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="border-[3px] border-black bg-[#7a00ff] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-white">
            <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-widest">Why Teams Choose It</span>
            <h2 className="mt-6 font-black text-4xl uppercase leading-tight text-white mb-4">A cleaner platform surface.</h2>
            <p className="text-xl font-bold text-white/90 mb-8">
              Agent Layer combines platform guidance, live testing, and network-aware infrastructure into a cohesive experience.
            </p>
            <div className="grid gap-4">
              <InfoRow icon={<ShieldCheck className="h-5 w-5" />} title="Operational clarity" description="Keep docs, testing, and platform concepts aligned." />
              <InfoRow icon={<Cable className="h-5 w-5" />} title="Flexible execution" description="Route requests through the network without complex diagrams." />
              <InfoRow icon={<Sparkles className="h-5 w-5" />} title="Modern developer experience" description="Clear entry points with progressively revealed complexity." />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-1">
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
      </main>
    </div>
  );
}

function InfoRow({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center bg-black text-white">
        {icon}
      </div>
      <div>
        <p className="text-lg font-black uppercase">{title}</p>
        <p className="mt-1 text-sm font-bold text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function LaunchCard({ href, icon, eyebrow, title, description }: { href: string; icon: ReactNode; eyebrow: string; title: string; description: string }) {
  return (
    <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
      <div>
        <div className="flex h-12 w-12 items-center justify-center bg-black text-white mb-4">
          {icon}
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-[#7a00ff] mb-2">{eyebrow}</p>
        <h3 className="text-2xl font-black uppercase mb-2 text-black">{title}</h3>
        <p className="text-gray-700 font-medium mb-6">{description}</p>
      </div>
      <Button asChild variant="outline" className="w-fit border-2 border-black rounded-none font-bold uppercase text-xs hover:bg-black hover:text-white">
        <Link href={href}>
          Open section
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
