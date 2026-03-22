"use client";

import {
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  Wrench,
  Sparkles,
  TableProperties,
  Users,
  ArrowLeft,
} from "lucide-react";
import React from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { AppSidebarShell, AppSidebarNavItem } from "@/components/shared/AppSidebarShell";

const navItemsConfig = [
  {
    key: "ads",
    href: "/centxo/ads",
    icon: BarChart3,
  },
  {
    key: "ad_accounts",
    href: "/centxo/ads?tab=ad_accounts",
    icon: Users,
  },
  {
    key: "create",
    href: "/centxo/ads?tab=create",
    icon: Sparkles,
  },
  {
    key: "tools",
    href: "/centxo/ads?tab=tools",
    icon: Wrench,
  },
  {
    key: "export",
    href: "/centxo/ads?tab=export",
    icon: FileSpreadsheet,
  },
  {
    key: "export_ads",
    href: "/centxo/ads?tab=export_ads",
    icon: TableProperties,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTheme();

  const navItems: AppSidebarNavItem[] = navItemsConfig.map((item) => ({
    href: item.href,
    label: t(`sidebar.${item.key}`),
    icon: item.icon,
  }));

  return (
    <AppSidebarShell
      appName="Centxo"
      appTagline="Facebook Ads assistant"
      navItems={navItems}
      collapsed={collapsed}
      onToggle={onToggle}
    />
  );
}
