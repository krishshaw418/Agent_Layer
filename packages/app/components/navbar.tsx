"use client";

import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

type NavbarProps = {
  onOpenMobileNav: () => void;
};

const labels: Record<string, string> = {
  "/": "Home",
  "/docs": "Documentation",
  "/playground": "Playground",
  "/about": "About",
  "/node": "Run a Node"
};

export function Navbar({ onOpenMobileNav }: NavbarProps) {
  const pathname = usePathname();
  const section =
    Object.keys(labels).find((item) =>
      item === "/" ? pathname === item : pathname === item || pathname.startsWith(`${item}/`)
    ) ?? "/";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenMobileNav}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Agent Layer</p>
            <p className="text-sm font-medium text-white">{labels[section]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Decentralized AI Infrastructure
          </div>
          <Button asChild size="sm">
            <Link href="/playground">Open Playground</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
