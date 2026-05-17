"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { APP_TAGLINE } from "@/lib/app-config";
import type { NavSection } from "@/lib/navigation";
import { NavIcon } from "@/components/nav-icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AppSidebarProps = {
  sections: NavSection[];
};

export function AppSidebar({ sections }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[4.25rem]" : "w-[15.5rem]",
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        {collapsed ? (
          <p
            className="font-heading w-full text-center text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.12em] text-sidebar-accent-foreground"
            title="IBEX"
          >
            IBEX
          </p>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[0.95rem] font-semibold uppercase leading-none tracking-wide text-sidebar-accent-foreground">
              IBEX
            </p>
            <p className="mt-0.5 truncate text-[0.65rem] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/55">
              {APP_TAGLINE}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        {sections.map((section, index) => (
          <div key={section.label ?? `section-${index}`}>
            {section.label && !collapsed && (
              <p className="mb-1.5 px-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
                {section.label}
              </p>
            )}
            {section.label && collapsed && (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.title : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md py-2 text-[0.8125rem] font-medium transition-colors",
                        collapsed ? "justify-center px-2" : "px-2.5",
                        active
                          ? "border-l-2 border-sidebar-primary bg-sidebar-accent pl-[calc(0.625rem-2px)] text-sidebar-accent-foreground"
                          : "border-l-2 border-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <NavIcon
                        name={item.icon}
                        className={cn(
                          "size-[1.05rem] shrink-0",
                          active
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/50",
                        )}
                      />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
