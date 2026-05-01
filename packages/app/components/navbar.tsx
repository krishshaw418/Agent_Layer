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
    <header className="sticky top-0 z-30 border-b-[3px] border-black bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden text-black hover:bg-gray-200 rounded-none border-[2px] border-transparent hover:border-black"
            onClick={onOpenMobileNav}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs uppercase font-black tracking-[0.18em] text-[#7a00ff]">Agent Layer</p>
            <p className="text-sm font-black text-black uppercase">{labels[section]}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 text-xs font-black uppercase text-black sm:flex shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="h-4 w-4 text-[#7a00ff]" />
            Decentralized AI Infra
          </div>
          <Button asChild size="sm" className="bg-[#7a00ff] text-white hover:bg-[#6000d6] rounded-none border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all">
            <Link href="/playground">Open Playground</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
