"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, ReceiptText, Sparkles, Settings, LogOut, Link2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const portalItems = [
  { key: "navigation", href: "/dashboard", icon: Layout, label: "All Apps" },
  { key: "connections", href: "/dashboard?menu=connections", icon: Link2, label: "Connections" },
  { key: "account", href: "/dashboard?menu=account", icon: Settings, label: "Account" },
  { key: "preferences", href: "/dashboard?menu=preferences", icon: Palette, label: "Preferences" },
  { key: "billing", href: "/dashboard?menu=billing", icon: ReceiptText, label: "Billing" },
  { key: "login", href: "/dashboard?menu=login", icon: Sparkles, label: "Sessions" },
];

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-16 bg-[#062329] text-slate-100 flex flex-col items-center py-3 gap-4 sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-50">
      {/* Logo mini */}
      <Link
        href="/dashboard"
        className="w-9 h-9 rounded-2xl bg-teal-500 flex items-center justify-center text-white font-bold italic shadow-lg shadow-teal-900/40"
      >
        N
      </Link>

      {/* Icons */}
      <nav className="flex-1 flex flex-col items-center gap-2 mt-2">
        {portalItems.map((item) => {
          const isActive =
            (item.key === "navigation" && pathname === "/dashboard") ||
            (item.key !== "navigation" && pathname.startsWith("/dashboard"));

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs",
                isActive && "bg-teal-500 text-white shadow-md shadow-teal-900/40"
              )}
              title={item.label}
            >
              <item.icon className="w-4 h-4" />
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-red-400 hover:bg-white/10 transition-colors text-xs mb-4"
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </aside>
  );
}

