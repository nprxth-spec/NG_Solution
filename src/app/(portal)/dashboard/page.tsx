"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Search, 
  Grid, 
  Heart, 
  Smartphone, 
  Globe, 
  Layout, 
  Settings, 
  Link2,
  HelpCircle, 
  Bell, 
  LogOut,
  ChevronRight,
  ExternalLink,
  Facebook,
  FileText,
  MousePointer2,
  Clock,
  Sparkles,
  SearchCode,
  ShieldCheck,
  Languages,
  LayoutDashboard,
  Zap,
  SunMedium,
  Moon,
  ReceiptText,
  Palette,
  Menu,
  X
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import Link from "next/link";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PortalBilling = dynamic(
  () => import("@/components/billing/PortalBilling").then(mod => mod.PortalBilling),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-500 animate-pulse">Loading billing details...</div> }
);
const PortalLoginSessions = dynamic(
  () => import("@/components/portal/account/PortalLoginSessions").then(mod => mod.PortalLoginSessions),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-500 animate-pulse">Loading sessions...</div> }
);
const PortalAccountSettings = dynamic(
  () => import("@/components/portal/account/PortalAccountSettings").then(mod => mod.PortalAccountSettings),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-500 animate-pulse">Loading settings...</div> }
);
const PortalConnections = dynamic(
  () => import("@/components/portal/account/PortalConnections").then(mod => mod.PortalConnections),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-500 animate-pulse">Loading connections...</div> }
);
const PortalPreferences = dynamic(
  () => import("@/components/portal/account/PortalPreferences").then(mod => mod.PortalPreferences),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-500 animate-pulse">Loading preferences...</div> }
);

const FAVORITES_STORAGE_KEY = "ng-dashboard-favorites";
const RECENT_APPS_STORAGE_KEY = "ng-dashboard-recent";
const MAX_RECENT = 6;

interface AppCardProps {
  title: string;
  description: string;
  icon: any;
  href: string;
  type: "WEB-APP" | "EXTENSION";
  color: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAccess?: () => void;
  compact?: boolean;
}

const HOVER_RING: Record<string, string> = {
  blue: "hover:ring-teal-400/50 hover:shadow-teal-500/20",
  teal: "hover:ring-teal-400/50 hover:shadow-teal-500/20",
  emerald: "hover:ring-emerald-400/50 hover:shadow-emerald-500/20",
  amber: "hover:ring-amber-400/50 hover:shadow-amber-500/20",
  green: "hover:ring-green-400/50 hover:shadow-green-500/20",
  rose: "hover:ring-rose-400/50 hover:shadow-rose-500/20",
};

const AppCard = ({ title, description, icon: Icon, href, type, color, isFavorite, onToggleFavorite, onAccess, compact }: AppCardProps) => {
  const colorMap: Record<string, string> = {
    blue: "bg-teal-500 text-teal-500 shadow-teal-500/10 bg-teal-500/10",
    teal: "bg-teal-500 text-teal-500 shadow-teal-500/10 bg-teal-500/10",
    emerald: "bg-emerald-500 text-emerald-500 shadow-emerald-500/10 bg-emerald-500/10",
    amber: "bg-amber-500 text-amber-500 shadow-amber-500/10 bg-amber-500/10",
    green: "bg-green-500 text-green-500 shadow-green-500/10 bg-green-500/10",
    rose: "bg-rose-500 text-rose-500 shadow-rose-500/10 bg-rose-500/10",
  };

  const colors = colorMap[color] || colorMap.blue;
  const bgClass = colors.split(" ")[0];
  const textClass = colors.split(" ")[1];
  const shadowClass = colors.split(" ")[2];
  const softBgClass = colors.split(" ")[3];
  const hoverRing = HOVER_RING[color] || HOVER_RING.blue;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.();
  };

  if (compact) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onAccess?.()}
        className={`group flex items-center gap-3 rounded-2xl border border-white/60 bg-white/40 px-3 py-2.5 w-64 shadow-lg shadow-slate-900/5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 hover:ring-2 backdrop-blur-xl dark:bg-slate-900/40 ${hoverRing}`}
      >
        <div className={`p-2.5 rounded-xl ${softBgClass} ${textClass} shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type}</p>
          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    );
  }

  return (
    <div className={`group relative overflow-hidden rounded-3xl border border-white/60 bg-white/40 p-6 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2.5 hover:ring-2 hover:shadow-teal-500/10 backdrop-blur-xl dark:bg-slate-900/40 ${hoverRing}`}>
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 pointer-events-none ${bgClass} group-hover:opacity-30 transition-opacity`} />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${softBgClass} ${textClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <button
          type="button"
          onClick={handleHeartClick}
          className="relative z-10 p-1 -m-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50/80 transition-colors"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>
      </div>

      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onAccess?.()}
        className="absolute inset-0 z-[1]"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="space-y-1 relative z-0">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type}</p>
          <ExternalLink className="w-3.5 h-3.5 text-teal-500/60 opacity-0 group-hover:opacity-100 transition-all -translate-y-1 group-hover:translate-y-0" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-teal-600 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
          {description}
        </p>
      </div>
    </div>
  );
};

type RecentItem = { href: string; accessedAt: number };

export default function AppSelectorDashboard() {
  const { data: session } = useSession();
  const { theme, setTheme, language, setLanguage } = useTheme();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("all");
  const [activeMenu, setActiveMenu] = useState<"navigation" | "billing" | "login" | "account" | "connections" | "preferences">("navigation");
  const [favoriteHrefs, setFavoriteHrefs] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const credits = session?.user?.credits ?? 0;
  const isBusiness = session?.user?.plan === "business";

  const profileImage = session?.user?.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name ?? "User")}&background=random`;
  const displayName = session?.user?.name ?? "newgate";

  // Load favorites and recent from localStorage (client-only)
  useEffect(() => {
    try {
      const rawFav = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (rawFav) {
        const parsed = JSON.parse(rawFav) as string[];
        if (Array.isArray(parsed)) setFavoriteHrefs(parsed);
      }
      const rawRecent = localStorage.getItem(RECENT_APPS_STORAGE_KEY);
      if (rawRecent) {
        const parsed = JSON.parse(rawRecent) as RecentItem[];
        if (Array.isArray(parsed)) setRecentItems(parsed);
      }
    } catch (_) {}
  }, []);

  const toggleFavorite = (href: string) => {
    setFavoriteHrefs((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const recordRecent = (href: string) => {
    const at = Date.now();
    setRecentItems((prev) => {
      const next = [{ href, accessedAt: at }, ...prev.filter((r) => r.href !== href)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_APPS_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const apps: AppCardProps[] = [
    {
      title: "Centxo (Facebook Ads)",
      description: "Automate reporting, campaign creation, and audience management for Facebook Ads.",
      icon: Facebook,
      href: "/centxo/ads",
      type: "WEB-APP",
      color: "blue",
    },
    {
      title: "FilesGo (Invoices)",
      description: "Extract data from Facebook Ads invoice PDFs automatically using AI.",
      icon: FileText,
      href: "/files-go/dashboard",
      type: "WEB-APP",
      color: "teal"
    },
    {
      title: "NG Workspace",
      description:
        "Overview of your export stats, success rate, and quick links to Centxo, FilesGo, and data tools.",
      icon: LayoutDashboard,
      href: "/workspace",
      type: "WEB-APP",
      color: "rose",
    },
    {
      title: "Ads Check by NG Solution",
      description: "Quickly verify ad status and compliance across all your accounts.",
      icon: SearchCode,
      href: "#",
      type: "WEB-APP",
      color: "emerald"
    },
    {
      title: "NG Solution Cookies",
      description: "Browser extension for easy cookie management and session handling.",
      icon: ShieldCheck,
      href: "#",
      type: "EXTENSION",
      color: "amber"
    },
    {
      title: "NG Solution Translator",
      description: "Translate your ad copy into multiple languages automatically.",
      icon: Languages,
      href: "#",
      type: "EXTENSION",
      color: "green"
    }
  ];

  // Initialize active menu from URL query (?menu=billing, login, account, connections)
  useEffect(() => {
    const searchMenu = searchParams.get("menu");
    if (searchMenu && ["navigation", "connections", "account", "billing", "login", "preferences"].includes(searchMenu)) {
      setActiveMenu(searchMenu as typeof activeMenu);
    }
  }, [searchParams]);

  return (
    <div className="h-screen bg-[#F0F8FF] dark:bg-slate-900 flex flex-col lg:flex-row overflow-hidden transition-colors duration-300">
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-6 h-16 bg-white/40 backdrop-blur-2xl border-b border-white/60 dark:bg-slate-900/60 dark:border-white/10 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white/60 border border-white/80 shadow-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:border-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold italic">N</div>
            <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">NG Solution</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 dark:bg-teal-500/10 dark:border-teal-500/20">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-tight">{isBusiness ? "Biz" : credits}</span>
            <Zap className="w-3 h-3 text-amber-500" />
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300 overflow-y-auto p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold italic">N</div>
                <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">NG Solution</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center py-4 mb-6 rounded-2xl bg-teal-50/50 border border-teal-100 dark:bg-teal-500/5 dark:border-white/5">
              <div className="w-14 h-14 rounded-full border-2 border-teal-400 p-1 mb-2">
                <img src={profileImage} alt={displayName} className="w-full h-full rounded-full object-cover" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-full px-2">{displayName}</p>
            </div>

            <nav className="flex-1 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Menu</p>
              <ul className="space-y-1">
                {[
                  { key: "navigation", label: "Navigation", icon: Layout },
                  { key: "connections", label: "Connections", icon: Link2 },
                  { key: "billing", label: "Billing", icon: ReceiptText },
                  { key: "account", label: "Account settings", icon: Settings },
                  { key: "preferences", label: "Preferences", icon: Palette },
                  { key: "login", label: "Login sessions", icon: Sparkles },
                ].map((item) => (
                  <li key={item.key}>
                    <button
                      onClick={() => {
                        setActiveMenu(item.key as any);
                        setIsMobileMenuOpen(false);
                        window.history.pushState(null, "", `/dashboard?menu=${item.key}`);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        activeMenu === item.key
                          ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                          : "text-slate-600 hover:bg-teal-50 dark:text-slate-400 dark:hover:bg-teal-500/10"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-6 w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all border border-rose-100 dark:border-rose-500/10"
            >
              <LogOut className="w-5 h-5" />
              Log out
            </button>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[350px] px-4 py-4 shrink-0">
        <div className="h-full w-full rounded-3xl bg-white/40 backdrop-blur-2xl border border-white/60 flex flex-col p-6 shadow-xl shadow-slate-900/5 dark:bg-slate-900/60 dark:border-white/10">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold italic">N</div>
          <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">NG Solution</span>
        </div>

        <div className="flex flex-col items-center py-6 mb-8 rounded-3xl bg-white/20 border border-white/30 backdrop-blur-md dark:bg-white/5 dark:border-white/10">
          <div className="w-20 h-20 rounded-full border-2 border-teal-400 p-1 mb-3">
            <div className="w-full h-full rounded-full bg-slate-200 overflow-hidden">
               <img src={profileImage} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Credits</p>
          <p className="text-xl font-bold text-teal-600 inline-flex items-center gap-1.5">
            <span>{isBusiness ? "Unlimited" : credits}</span>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-teal-500 text-amber-400 bg-transparent">
              <Zap className="w-3 h-3" />
            </span>
          </p>
        </div>

        <nav className="flex-1 space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Main Menu</p>
            <ul className="space-y-1">
              {[
                { key: "navigation", label: "Navigation", icon: Layout },
                { key: "connections", label: "Connections", icon: Link2 },
                { key: "billing", label: "Billing", icon: ReceiptText },
                { key: "account", label: "Account settings", icon: Settings },
                { key: "preferences", label: "Preferences", icon: Palette },
                { key: "login", label: "Login sessions", icon: Sparkles },
              ].map((item, idx) => (
                <li key={idx}>
                  <a
                    href={`/dashboard?menu=${item.key}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveMenu(item.key as any);
                      window.history.pushState(null, "", `/dashboard?menu=${item.key}`);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      activeMenu === item.key
                        ? "bg-teal-400 text-white shadow-lg shadow-teal-500/30"
                        : "text-slate-600 hover:bg-teal-50 hover:text-teal-600 dark:text-slate-400 dark:hover:bg-teal-500/10 dark:hover:text-teal-400"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="pt-6 border-t border-slate-200 dark:border-white/5 space-y-2 relative">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all">
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-0 shadow-2xl overflow-hidden max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>ออกจากระบบ</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณต้องการออกจากระบบหรือไม่? ระบบจะทำการล้าง Session ปัจจุบัน
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel className="rounded-xl border-slate-200 hover:bg-slate-100">ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
                  >
                    ยืนยัน
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto transition-all duration-500 ${
        ["navigation", "connections", "billing"].includes(activeMenu) 
          ? "py-8 px-4 sm:px-8 lg:py-10 lg:px-16 text-slate-600 dark:text-slate-300" 
          : "py-8 px-4 sm:px-10 md:px-16 lg:py-16 lg:px-[15%] xl:py-20 xl:px-[20%] text-slate-600 dark:text-slate-300"
      }`}>
        <div className={`mx-auto transition-all duration-500 w-full ${
          ["navigation", "connections", "billing"].includes(activeMenu) ? "max-w-7xl" : "max-w-4xl"
        }`}>
            {activeMenu === "navigation" && (
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-8 lg:mb-10">
              <div>
                <div className="mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Hi, {displayName}</h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 ml-0 line-clamp-1">Welcome to the dashboard, select an application to continue</p>
              </div>
            </header>
          )}

        {activeMenu === "navigation" && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-6 sm:gap-8 mb-8 sm:mb-10 border-b border-slate-200 dark:border-white/5 pb-4 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex items-center gap-2 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${
                  activeTab === "all" ? "text-teal-600" : "text-slate-400"
                }`}
              >
                <Grid className="w-4 h-4" />
                All apps
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-[10px] text-white">
                  {apps.length}
                </span>
                {activeTab === "all" && (
                  <span className="absolute -bottom-[17px] left-0 w-full h-[3px] bg-teal-500 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("fav")}
                className={`flex items-center gap-2 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${
                  activeTab === "fav" ? "text-teal-600" : "text-slate-400"
                }`}
              >
                <Heart className="w-4 h-4 fill-current" />
                Favorites
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-[10px] text-slate-500 font-bold">
                  {favoriteHrefs.length}
                </span>
                {activeTab === "fav" && (
                  <span className="absolute -bottom-[17px] left-0 w-full h-[3px] bg-teal-500 rounded-t-full" />
                )}
              </button>
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-10">
              {(activeTab === "fav" ? apps.filter((a) => favoriteHrefs.includes(a.href)) : apps).length === 0 ? (
                activeTab === "fav" && (
                  <div className="col-span-full rounded-3xl border border-white/40 bg-white/40 p-10 flex flex-col items-center justify-center text-center backdrop-blur-md">
                    <Heart className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No favorites yet</p>
                    <p className="text-xs text-slate-400 mt-1">Click the heart on any app to add it here.</p>
                  </div>
                )
              ) : (
                (activeTab === "fav" ? apps.filter((a) => favoriteHrefs.includes(a.href)) : apps).map((app) => (
                  <AppCard
                    key={app.title}
                    {...app}
                    isFavorite={favoriteHrefs.includes(app.href)}
                    onToggleFavorite={() => toggleFavorite(app.href)}
                    onAccess={() => recordRecent(app.href)}
                  />
                ))
              )}
            </div>

            {/* Recent Apps Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Layout className="w-4 h-4 text-slate-400" />
                Recent Apps
              </h2>
              {recentItems.length === 0 ? (
                <div className="rounded-3xl border border-white/40 bg-white/40 p-10 flex flex-col items-center justify-center text-center backdrop-blur-md">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                    <Search className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 font-medium">No apps yet ...</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {recentItems.map((r) => {
                    const app = apps.find((a) => a.href === r.href);
                    if (!app) return null;
                    return (
                      <AppCard
                        key={r.href + r.accessedAt}
                        {...app}
                        compact
                        onAccess={() => recordRecent(app.href)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeMenu === "billing" && (
          <section className="space-y-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-slate-400" />
              Plans & billing
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Manage your main subscription and credits for use across both Centxo and FilesGo.
            </p>

            <div className="rounded-2xl sm:rounded-3xl border border-white/40 bg-white/40 px-5 py-6 sm:px-10 sm:py-10 md:px-16 md:py-12 lg:px-32 lg:py-16 backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700 overflow-hidden">
              <div className="-m-2 sm:-m-4 lg:-m-6">
                <PortalBilling />
              </div>
            </div>
          </section>
        )}

        {activeMenu === "login" && (
          <section className="space-y-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-400" />
              Login sessions
            </h2>
            <div className="rounded-2xl sm:rounded-3xl border border-white/40 bg-white/40 px-5 py-6 sm:px-10 sm:py-10 md:px-16 md:py-12 lg:px-32 lg:py-16 backdrop-blur-xl text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
              <PortalLoginSessions />
            </div>
          </section>
        )}

        {activeMenu === "account" && (
          <section className="space-y-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              Account settings
            </h2>
            <div className="rounded-2xl sm:rounded-3xl border border-white/40 bg-white/40 px-5 py-6 sm:px-10 sm:py-10 md:px-16 md:py-12 lg:px-32 lg:py-16 backdrop-blur-xl text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
              <PortalAccountSettings />
            </div>
          </section>
        )}

        {activeMenu === "connections" && (
          <section className="space-y-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-slate-400" />
              Connections
            </h2>
            <div className="rounded-2xl sm:rounded-3xl border border-white/40 bg-white/40 px-5 py-6 sm:px-10 sm:py-10 md:px-16 md:py-12 lg:px-32 lg:py-16 backdrop-blur-xl text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
              <PortalConnections />
            </div>
          </section>
        )}

        {activeMenu === "preferences" && (
          <section className="space-y-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-400" />
              Preferences
            </h2>
            <div className="rounded-2xl sm:rounded-3xl border border-white/40 bg-white/40 px-5 py-6 sm:px-10 sm:py-10 md:px-16 md:py-12 lg:px-32 lg:py-16 backdrop-blur-xl text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
              <PortalPreferences />
            </div>
          </section>
        )}
        </div>
      </main>
    </div>
  );
}
