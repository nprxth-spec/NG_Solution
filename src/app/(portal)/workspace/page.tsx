"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Facebook,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Link2,
  Loader2,
  Rows3,
  Table2,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

type RecentLog = {
  id: string;
  configName: string | null;
  exportType: string;
  status: string;
  rowCount: number;
  createdAt: string;
};

type StatsPayload = {
  managerAccountCount: number;
  monthlyExports: number;
  totalRows: number;
  successRate: number;
  recentLogs: RecentLog[];
};

export default function WorkspacePage() {
  const { language } = useTheme();
  const th = language === "th";
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!cancelled) setStats(d as StatsPayload);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shortcuts = [
    {
      href: "/centxo/ads",
      label: th ? "Centxo — โฆษณา" : "Centxo — Ads",
      sub: "Facebook Ads",
      icon: Facebook,
      className: "bg-teal-500/10 text-teal-600",
    },
    {
      href: "/files-go/dashboard",
      label: th ? "FilesGo — ใบแจ้งหนี้" : "FilesGo — Invoices",
      sub: "PDF & Sheets",
      icon: FileText,
      className: "bg-cyan-500/10 text-cyan-600",
    },
    {
      href: "/centxo/export/logs",
      label: th ? "ประวัติ Export" : "Export history",
      sub: "Centxo",
      icon: FileSpreadsheet,
      className: "bg-emerald-500/10 text-emerald-600",
    },
    {
      href: "/data",
      label: th ? "ศูนย์ข้อมูล" : "Data hub",
      sub: "NG Solution",
      icon: Table2,
      className: "bg-violet-500/10 text-violet-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0F8FF] dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
            >
              <ArrowLeft className="h-4 w-4" />
              {th ? "กลับแดชบอร์ด" : "Back to dashboard"}
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 shadow-inner">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  NG Workspace
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {th
                    ? "สรุปสถิติและทางลัดไปเครื่องมือหลักในที่เดียว"
                    : "Your export stats and shortcuts in one place"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            {th
              ? "โหลดสถิติไม่สำเร็จ — ลองรีเฟรชหน้า"
              : "Could not load stats — try refreshing."}
          </div>
        )}

        {!stats && !loadError && (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {stats && (
          <>
            <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Link2}
                label={th ? "บัญชีโฆษณา (ใช้งาน)" : "Active ad accounts"}
                value={stats.managerAccountCount}
              />
              <StatCard
                icon={BarChart3}
                label={th ? "Export เดือนนี้" : "Exports this month"}
                value={stats.monthlyExports}
              />
              <StatCard
                icon={Rows3}
                label={th ? "แถวที่ส่งออกสำเร็จ (รวม)" : "Rows exported (all time)"}
                value={stats.totalRows.toLocaleString()}
              />
              <StatCard
                icon={CheckCircle2}
                label={th ? "อัตราสำเร็จ" : "Success rate"}
                value={`${stats.successRate}%`}
              />
            </div>

            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                <ExternalLink className="h-4 w-4" />
                {th ? "ทางลัด" : "Shortcuts"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {shortcuts.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="group flex items-center gap-3 rounded-2xl border border-white/60 bg-white/50 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/50"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.className}`}
                    >
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {s.label}
                      </p>
                      <p className="truncate text-xs text-slate-500">{s.sub}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
                {th ? "การส่งออกล่าสุด" : "Recent exports"}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/50 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/50">
                {stats.recentLogs.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">
                    {th ? "ยังไม่มีประวัติ export" : "No export history yet"}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-slate-800/50">
                          <th className="px-4 py-3 font-semibold">
                            {th ? "งาน" : "Job"}
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            {th ? "ประเภท" : "Type"}
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            {th ? "สถานะ" : "Status"}
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            {th ? "แถว" : "Rows"}
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            {th ? "เมื่อ" : "When"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="border-b border-slate-100 last:border-0 dark:border-white/5"
                          >
                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                              {log.configName ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {log.exportType}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={
                                  log.status === "success"
                                    ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                                    : "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300"
                                }
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                              {log.rowCount}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(log.createdAt).toLocaleString(
                                th ? "th-TH" : "en-US",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/50">
      <div className="mb-3 flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
