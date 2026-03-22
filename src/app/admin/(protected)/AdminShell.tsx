"use client";

import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import { AdminNavLink } from "@/components/admin/AdminNavLink";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/logs", label: "Centxo Logs" },
  { href: "/admin/logs/files-go", label: "FilesGo Logs" },
  { href: "/admin/logs/activity", label: "Activity Logs" },
  { href: "/admin/logs/audit", label: "Audit Logs" },
];

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    for (const item of navItems) {
      router.prefetch(item.href);
    }
  }, [router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (e) {
      console.error("Failed to logout admin", e);
      router.push("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  }

  const navBody = (
    <>
      <div className="space-y-1">
        <div className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">
          NG Solution
        </div>
        <div className="text-base font-semibold tracking-wide text-slate-900">
          Unified Admin
        </div>
      </div>
      <nav className="flex flex-col gap-1.5 text-sm">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : item.href === "/admin/logs"
                ? pathname === "/admin/logs"
                : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <AdminNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={active}
            />
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {navOpen && (
        <button
          type="button"
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* Sidebar — drawer บนมือถือ */}
      <aside
        className={[
          "w-56 shrink-0 border-r border-slate-200 bg-white/95 px-4 py-6 flex flex-col gap-6 backdrop-blur",
          "fixed inset-y-0 left-0 z-40 flex-col transition-transform duration-200 md:static md:translate-x-0",
          navOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between md:hidden">
          <span className="text-sm font-semibold text-slate-800">เมนู</span>
          <button
            type="button"
            aria-label="ปิดเมนู"
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
            onClick={() => setNavOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navBody}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50 min-w-0">
        <header className="h-14 border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-3 bg-white/95 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              aria-label="เปิดเมนู"
              className="inline-flex rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden shrink-0"
              onClick={() => setNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm font-semibold text-slate-800 truncate">
              Admin Console
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60 cursor-pointer"
          >
            {loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </button>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export const AdminShell = memo(AdminShellInner);
