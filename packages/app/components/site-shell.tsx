"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";

export function SiteShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("agent-layer-sidebar");
    setCollapsed(saved === "collapsed");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("agent-layer-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  const sidebarWidth = collapsed ? "5.5rem" : "18rem";

  return (
    <div className="min-h-screen">
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden border-r-[3px] border-black bg-white md:block"
        style={{ width: sidebarWidth }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm border-r-[3px] border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-end p-3 border-b-[3px] border-black">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="hover:bg-gray-200 rounded-none text-black">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sidebar collapsed={false} onToggle={() => undefined} onNavigate={() => setMobileOpen(false)} mobile />
          </div>
        </div>
      )}
      <div
        className="md:transition-[padding] md:duration-200 md:[padding-left:var(--sidebar-width)]"
        style={{ ["--sidebar-width" as string]: sidebarWidth }}
      >
        <div className="md:hidden">
          <Navbar onOpenMobileNav={() => setMobileOpen(true)} />
        </div>
        <div className="hidden md:block">
          <Navbar onOpenMobileNav={() => setMobileOpen(true)} />
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
