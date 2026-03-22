"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { PortalSidebar } from "@/components/shared/PortalSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#062329] transition-colors overflow-hidden">
      <PortalSidebar />
      <div className="transition-all duration-300 h-screen flex flex-1 min-w-0 pr-1 py-1 lg:pr-1.5 lg:py-1.5 overflow-hidden">
        <div className="w-full h-full rounded-xl bg-white shadow-2xl shadow-slate-900/10 border border-white/60 overflow-hidden flex">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="p-0 flex-1 min-h-0 h-full overflow-hidden text-slate-700 flex flex-col">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
