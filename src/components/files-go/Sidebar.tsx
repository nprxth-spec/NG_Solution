"use client";

import { useEffect, useState } from "react";
import { Upload, History, FileText, Wrench } from "lucide-react";
import { AppSidebarShell, AppSidebarNavItem } from "@/components/shared/AppSidebarShell";

const navItems: AppSidebarNavItem[] = [
  { href: "/files-go/dashboard?tab=upload", label: "Upload", icon: Upload },
  { href: "/files-go/dashboard?tab=history", label: "History", icon: History },
  { href: "/files-go/dashboard?tab=integrations", label: "Integrations", icon: Wrench },
  { href: "/files-go/dashboard?tab=naming", label: "Filename Rules", icon: FileText },
  // Billing moved to main portal dashboard Plans & billing
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    // Restore collapsed state from localStorage; on small screens start collapsed
    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem("sidebar-collapsed");
        const isNarrow = window.innerWidth < 768;
        if (stored === "true" || isNarrow) {
            setCollapsed(true);
        }
    }, []);

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") {
                window.localStorage.setItem("sidebar-collapsed", String(next));
            }
            return next;
        });
    };

    return (
      <AppSidebarShell
        appName="FilesGo"
        appTagline="Invoices to Google Sheets"
        navItems={navItems}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
      />
    );
}
