import Link from "next/link";
import { ArrowRight, Download, ServerCog, ShieldCheck, TerminalSquare } from "lucide-react";

import { Button } from "@/components/ui/button";

const setupScriptUrl = "/api/run-a-node/setup-sh";

export default function RunANodePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_0.8fr] lg:items-stretch">
        <div className="border-[3px] border-black bg-white p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <div className="inline-flex border-[2px] border-black bg-[#7a00ff] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
            Node Setup
          </div>
          <h1 className="mt-5 text-4xl font-black uppercase leading-none tracking-tight text-black sm:text-5xl">
            Run a Node
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-gray-700">
            Download the setup script, configure your credentials, and start an Agent Layer node with a single guided flow.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <InfoCard title="Download" description="Get the setup bootstrap script from the official repository." icon={<Download className="h-5 w-5" />} />
            <InfoCard title="Configure" description="Fill in your wallet, RPC, API key, and model settings." icon={<ShieldCheck className="h-5 w-5" />} />
            <InfoCard title="Run" description="Launch the node locally and keep the terminal open." icon={<TerminalSquare className="h-5 w-5" />} />
          </div>
        </div>

        <div className="border-[3px] border-black bg-[#7a00ff] p-6 text-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Download script</p>
          <h2 className="mt-3 text-2xl font-black uppercase leading-tight">setup</h2>
          <p className="mt-4 text-sm leading-7 text-white/90">
            This script helps you bootstrap the node locally. It creates the node folder structure, writes the default config, and walks you through the required values.
          </p>

          <Button asChild className="mt-6 w-full rounded-none border-[3px] border-black bg-black px-6 py-6 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black">
            <a href={setupScriptUrl} download="setup.sh">
              Download setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>

          <div className="mt-5 border-[2px] border-black bg-white p-4 text-sm font-black uppercase tracking-wider text-black">
            Open the file and run it from the folder where you downloaded it.
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a00ff]">What it does</p>
          <h2 className="mt-2 text-2xl font-black uppercase text-black">A guided node bootstrap</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-gray-700">
            <li>Clones the node server into a local workspace</li>
            <li>Generates the default configuration automatically</li>
            <li>Prompts for the credentials needed to run your node</li>
            <li>Starts the server once setup is complete</li>
          </ul>
        </div>

        <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a00ff]">Quick start</p>
          <h2 className="mt-2 text-2xl font-black uppercase text-black">After download</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-gray-700">
            <p>Make the script executable, then run it from the directory where it was downloaded.</p>
            <div className="border-[2px] border-black bg-[#f7f7f7] p-4 font-mono text-black">
              chmod +x setup.sh
              <br />
              ./setup.sh
            </div>
            <p>The script will guide you through the remaining setup steps and start the node for you.</p>
          </div>
        </div>
      </section>

      <section className="border-[3px] border-black bg-[#f7f7f7] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a00ff]">Need help?</p>
        <h2 className="mt-2 text-2xl font-black uppercase text-black">Use the official setup script</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-700">
          If you want to run an Agent Layer node, start with the setup script above. It is the intended entry point for downloading the node bootstrap flow and preparing your local environment.
        </p>
      </section>
    </div>
  );
}

function InfoCard({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border-[3px] border-black bg-[#f7f7f7] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex h-10 w-10 items-center justify-center border-[2px] border-black bg-black text-white">{icon}</div>
      <p className="mt-4 text-sm font-black uppercase tracking-wider text-black">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-700">{description}</p>
    </div>
  );
}
