"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ChevronDown, Home, BookOpen, PlaySquare, ServerCog, Layers3 } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Home", href: "/", icon: Home },
  {
    title: "Docs",
    icon: BookOpen,
    items: [
      {
        title: "Get Started",
        href: "/docs/get-started"
      },
      {
        title: "Agent Layer SDK",
        href: "/docs/sdk",
        items: [
          { title: "Chat Completions", href: "/docs/sdk#chat-completions" },
          { title: "Embeddings", href: "/docs/sdk#embeddings" },
          { title: "Account Balance", href: "/docs/sdk#account-balance" },
          { title: "Token Estimation", href: "/docs/sdk#token-estimation" }
        ]
      },
      {
        title: "Agent Layer Node",
        href: "/docs/node"
      }
    ]
  },
  {
    title: "Play Ground",
    icon: PlaySquare,
    items: [
      { title: "Chat Completions", href: "/playground#chat-completions" },
      { title: "Embeddings", href: "/playground#embeddings" },
      { title: "Account Balance", href: "/playground#account-balance" },
      { title: "Token Estimation", href: "/playground#token-estimation" }
    ]
  },
  { title: "Run A Node", href: "/run-a-node", icon: ServerCog },
  { title: "About", href: "/about", icon: Layers3 }
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
};

function SubExpandableNavItem({ item, pathname, onNavigate }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (!item.items || item.items.length === 0) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "block px-3 py-2 text-sm transition font-black uppercase tracking-wider border-[2px] rounded-none",
          active
            ? "bg-[#7a00ff] text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
            : "text-gray-600 border-transparent hover:border-black hover:bg-gray-100"
        )}
      >
        {item.title}
      </Link>
    );
  }

  return (
    <div className="flex flex-col space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-3 py-2 text-sm transition font-black uppercase tracking-wider border-[2px] rounded-none",
          active
            ? "bg-[#7a00ff] text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
            : "text-gray-600 border-transparent hover:border-black hover:bg-gray-100"
        )}
      >
        <span>{item.title}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
      </button>
      {isExpanded && (
        <div className="ml-4 mt-1 flex flex-col space-y-1 border-l-[2px] border-black pl-3">
          {item.items.map((sub: any) => (
            <Link
              key={sub.title}
              href={sub.href}
              onClick={onNavigate}
              className={cn(
                "block px-3 py-2 text-xs transition font-black uppercase tracking-wider border-[2px] rounded-none",
                "text-gray-500 border-transparent hover:border-black hover:bg-gray-100"
              )}
            >
              {sub.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpandableNavItem({ item, collapsed, pathname, onNavigate }: any) {
  const [isExpanded, setIsExpanded] = useState(() => item.title === "Docs" && pathname.startsWith("/docs"));
  const Icon = item.icon;
  const active = item.href
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : item.title === "Docs"
      ? pathname.startsWith("/docs")
      : false;

  useEffect(() => {
    if (item.title === "Docs" && pathname.startsWith("/docs")) {
      setIsExpanded(true);
    }
  }, [item.title, pathname]);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full group flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition font-black uppercase tracking-wider border-[2px] rounded-none",
          active
            ? "bg-[#7a00ff] text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
            : "text-gray-700 border-transparent hover:border-black hover:bg-gray-100"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </div>
        {!collapsed && (
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
        )}
      </button>
      {!collapsed && isExpanded && item.items && item.items.length > 0 && (
        <div className="ml-6 mt-1 flex flex-col space-y-1 border-l-[2px] border-black pl-3">
          {item.items.map((subItem: any) => (
            <SubExpandableNavItem key={subItem.title} item={subItem} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

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
          <Image src="/agent_layer_logo.png" alt="Agent Layer" width={30} height={30} className="h-30 w-30 object-contain" />
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
          {menuItems.map((item) => {
            if (item.items) {
              return <ExpandableNavItem key={item.title} item={item} collapsed={collapsed} pathname={pathname} onNavigate={onNavigate} />;
            }
            const active =
              item.href === "/"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href!}
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
