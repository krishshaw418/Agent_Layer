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
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b-[3px] border-black px-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={onNavigate}>
          <div className="flex h-11 w-11 items-center justify-center bg-[#7a00ff] border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-black text-white">AL</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-black text-black uppercase tracking-tight">{siteConfig.name}</p>
              <p className="truncate text-[10px] font-bold text-gray-500 uppercase">{siteConfig.description}</p>
            </div>
          )}
        </Link>
        {!mobile && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="text-black border-[2px] border-transparent hover:border-black hover:bg-gray-100 rounded-none shadow-none">
            {collapsed ? <ChevronRight className="h-5 w-5 font-black" /> : <ChevronLeft className="h-5 w-5 font-black" />}
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
                  "group flex items-center gap-3 px-3 py-2.5 text-sm transition font-black uppercase tracking-wider border-[2px] rounded-none mb-1",
                  active
                    ? "bg-[#7a00ff] text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                    : "text-gray-700 border-transparent hover:border-black hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
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
                  "block px-3 py-2 text-sm transition font-black uppercase tracking-wider border-[2px] rounded-none mb-1",
                  active
                    ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(122,0,255,1)] translate-x-[-2px] translate-y-[-2px]"
                    : "text-gray-600 border-transparent hover:border-black hover:bg-gray-100"
                )}
              >
                {!collapsed ? item.title : item.title.slice(0, 1)}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="border-t-[3px] border-black p-4">
        <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {!collapsed ? (
            <>
              <p className="text-sm font-black text-[#7a00ff] uppercase tracking-widest">Node market</p>
              <p className="mt-1 text-xs font-bold leading-5 text-gray-700 uppercase">
                Providers earn for compute, developers route by strategy, and the network stays composable.
              </p>
            </>
          ) : (
            <p className="text-center text-xs font-black text-[#7a00ff]">N</p>
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
        "px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#7a00ff]",
        collapsed && "text-center"
      )}
    >
      {collapsed ? "•" : children}
    </p>
  );
}
