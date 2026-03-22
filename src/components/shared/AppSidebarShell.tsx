"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Zap, type LucideIcon } from "lucide-react";

export interface AppSidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface AppSidebarShellProps {
  appName: string;
  appTagline: string;
  navItems: AppSidebarNavItem[];
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebarShell({
  appName,
  appTagline,
  navItems,
  collapsed,
  onToggle,
}: AppSidebarShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (currentUrl === href) return;
    e.preventDefault();

    // If navigating within the same pathname (SPA tab switch), use pushState for instant local transition
    const isSamePathname = href.startsWith(pathname + "?") || href === pathname;

    if (isSamePathname) {
      window.history.pushState(null, "", href);
    } else {
      router.push(href);
    }
  };

  return (
    <aside className={cn("h-full bg-white text-slate-800 border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0 rounded-l-xl", collapsed ? "w-16" : "w-64")}>
      {/* Logo */}
      <div className="flex flex-col h-auto py-3 px-3 border-b border-gray-200 bg-white/80">
        <div className={cn("flex items-center h-12 mb-3", collapsed ? "justify-center" : "justify-between")}>
          <Link href={navItems[0]?.href ?? "/"} className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-md shadow-teal-300/40">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="whitespace-nowrap">
                <p className="font-bold text-sm">{appName}</p>
                <p className="text-[11px] text-slate-400">{appTagline}</p>
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 bg-white">
        <ul className="space-y-1">
          {navItems.map((item) => {
            // Find the most specific (longest) matching href for the current URL
            const itemUrl = new URL(item.href, "http://localhost");
            const itemMatches =
              // Exact match with search params
              currentUrl === item.href ||
              // Or exact pathname match if no search params are involved and we are at the root of this path
              (itemUrl.pathname === pathname && !itemUrl.search && !searchParams.toString()) ||
              // Or prefix match (for purely path-based routing) fallback
              (pathname.startsWith(`${itemUrl.pathname}/`) && !itemUrl.search);

            const longestMatch = [...navItems]
              .sort((a, b) => b.href.length - a.href.length)
              .find((n) => {
                const nUrl = new URL(n.href, "http://localhost");
                return currentUrl === n.href ||
                  (nUrl.pathname === pathname && !nUrl.search && !searchParams.toString()) ||
                  (pathname.startsWith(`${nUrl.pathname}/`) && !nUrl.search);
              });

            const isActive = longestMatch?.href === item.href;

            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer",
                    collapsed ? "justify-center" : "gap-3",
                    isActive
                      ? "bg-teal-500 text-white shadow-md shadow-teal-300/40"
                      : "text-slate-500 hover:text-teal-600 hover:bg-teal-50/80"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                    </>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section: collapse toggle only */}
      <div className="border-t border-gray-200 bg-white/80">
        <div className="p-3">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all",
              collapsed ? "justify-center" : "gap-3 justify-start"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

