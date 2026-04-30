"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { docsNav, mainNav, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
};

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
  mobile = false
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={onNavigate}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
            <span className="font-semibold">AL</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{siteConfig.name}</p>
              <p className="truncate text-xs text-slate-500">{siteConfig.description}</p>
            </div>
          )}
        </Link>
        {!mobile && (
          <Button variant="ghost" size="icon" onClick={onToggle}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <div className="space-y-1">
          <Label collapsed={collapsed}>Navigate</Label>
          {mainNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-cyan-400/12 text-cyan-200"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>
        <div className="space-y-1">
          <Label collapsed={collapsed}>Docs</Label>
          {docsNav.map((item) => {
            const href = item.slug === "introduction" ? "/docs" : `/docs/${item.slug}`;
            const active =
              (item.slug === "introduction" && pathname === "/docs") ||
              pathname === href;

            return (
              <Link
                key={item.slug}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-white/8 text-white"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {!collapsed ? item.title : item.title.slice(0, 1)}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/10 p-4">
          {!collapsed ? (
            <>
              <p className="text-sm font-medium text-emerald-200">Node market</p>
              <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                Providers earn for compute, developers route by strategy, and the network stays composable.
              </p>
            </>
          ) : (
            <p className="text-center text-xs font-medium text-emerald-200">N</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({
  collapsed,
  children
}: {
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500",
        collapsed && "text-center"
      )}
    >
      {collapsed ? "•" : children}
    </p>
  );
}
