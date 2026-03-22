"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

interface ManagerAccount {
  id: string;
  accountId: string;
  name: string;
  platform: string;
  isActive: boolean;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const ACCOUNTS_PER_PAGE = 10;

export function PortalManagerAccounts() {
  const { data: session } = useSession();
  const { language } = useTheme();
  const isThai = language === "th";

  const connectedProviders = session?.user?.connectedProviders ?? [];
  const hasFacebook = connectedProviders.includes("facebook");

  const [accounts, setAccounts] = useState<ManagerAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsSearch, setAccountsSearch] = useState("");
  const [syncingFbAccounts, setSyncingFbAccounts] = useState(false);
  const [fbStatuses, setFbStatuses] = useState<Record<string, number>>({});

  const filteredAccounts = useMemo(() => {
    if (!accountsSearch.trim()) return accounts;
    const q = accountsSearch.toLowerCase();
    return accounts.filter(
      (acc) =>
        acc.name.toLowerCase().includes(q) ||
        acc.accountId.toLowerCase().includes(q)
    );
  }, [accounts, accountsSearch]);

  const getAccountStatusLabel = (acc: ManagerAccount) => {
    const code = fbStatuses[acc.accountId] ?? fbStatuses[acc.id];
    switch (code) {
      case 1:
        return isThai ? "ใช้งานได้" : "Active";
      case 2:
        return isThai ? "ถูกปิดใช้งาน" : "Disabled";
      case 3:
        return isThai ? "มีปัญหาการชำระเงิน" : "Unsettled";
      case 7:
        return isThai ? "กำลังจะปิด" : "Pending closure";
      case 9:
        return isThai ? "ช่วงผ่อนผัน" : "In grace period";
      default:
        return isThai ? "ไม่ทราบสถานะ" : "Unknown";
    }
  };

  const syncManagerAccountsFromFacebook = async (silent = false) => {
    setSyncingFbAccounts(true);
    try {
      const res = await fetch("/api/facebook/sync/ad-accounts", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถดึงบัญชีจาก Facebook ได้");
      }

      if (!silent) {
        if (data.rateLimited && typeof data.secondsLeft === "number") {
          const secs = data.secondsLeft;
          const minutes = Math.floor(secs / 60);
          const seconds = secs % 60;
          toast.info(
            isThai
              ? `ใช้ข้อมูลล่าสุด (ซิงค์ใหม่ได้อีกครั้งใน ${minutes} นาที ${seconds} วินาที)`
              : `Cached data used (Sync again in ${minutes}m ${seconds}s)`
          );
        } else if (!data.rateLimited) {
          toast.success(
            isThai
              ? "ดึงบัญชีจาก Facebook และอัปเดตเรียบร้อย"
              : "Ad accounts synced"
          );
        }
      }

      if (Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
        setAccountsPage(1);
      }

      try {
        const fbRes = await fetch("/api/facebook/ad-accounts");
        const fbData = await fbRes.json();
        if (fbRes.ok && Array.isArray(fbData.accounts)) {
          const map: Record<string, number> = {};
          fbData.accounts.forEach(
            (acc: { id: string; accountId: string; status?: number }) => {
              if (typeof acc.status === "number") {
                map[acc.id] = acc.status;
                map[acc.accountId] = acc.status;
              }
            }
          );
          setFbStatuses(map);
        }
      } catch {
        // ignore
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "ไม่สามารถดึงบัญชีจาก Facebook ได้"
      );
    } finally {
      setSyncingFbAccounts(false);
      setAccountsLoading(false);
    }
  };

  const reloadManagerAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await fetch("/api/manager-accounts");
      const data = await res.json();
      if (Array.isArray(data)) setAccounts(data);

      try {
        const fbRes = await fetch("/api/facebook/ad-accounts");
        const fbData = await fbRes.json();
        if (!fbData.error && Array.isArray(fbData.accounts)) {
          const map: Record<string, number> = {};
          for (const acc of fbData.accounts) {
            if (typeof acc.status === "number") {
              map[acc.id] = acc.status;
              map[acc.accountId] = acc.status;
            }
          }
          setFbStatuses(map);
        }
      } catch {
        // ignore
      }
    } catch {
      toast.error("โหลดบัญชีไม่สำเร็จ");
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (hasFacebook) {
      reloadManagerAccounts();
      syncManagerAccountsFromFacebook(true);
    } else {
      setAccounts([]);
      setAccountsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, hasFacebook]);

  useEffect(() => {
    setAccountsPage(1);
  }, [accountsSearch]);

  const toggleAccount = async (acc: ManagerAccount) => {
    const originalState = acc.isActive;
    const newState = !originalState;

    setAccounts((p) =>
      p.map((a) => (a.id === acc.id ? { ...a, isActive: newState } : a))
    );

    try {
      const res = await fetch("/api/manager-accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: acc.id, isActive: newState }),
      });

      if (!res.ok) {
        throw new Error("Failed to update account");
      }

      const updated = await res.json();
      setAccounts((p) => p.map((a) => (a.id === acc.id ? updated : a)));
    } catch (error) {
      setAccounts((p) =>
        p.map((a) => (a.id === acc.id ? { ...a, isActive: originalState } : a))
      );
      toast.error(
        isThai ? "บันทึกการตั้งค่าไม่สำเร็จ" : "Failed to toggle account"
      );
    }
  };

  if (!hasFacebook && accounts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700/80">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isThai
            ? "บัญชีโฆษณา (Manager Accounts)"
            : "Ad accounts (Manager Accounts)"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isThai
            ? "เลือกบัญชีโฆษณา Facebook ที่ต้องการใช้ในระบบ"
            : "Select which Facebook ad accounts to use in the system."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder={
              isThai
                ? "ค้นหาตามชื่อหรือ Account ID..."
                : "Search by name or Account ID..."
            }
            value={accountsSearch}
            onChange={(e) => setAccountsSearch(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => syncManagerAccountsFromFacebook()}
            disabled={accountsLoading || syncingFbAccounts}
          >
            <Loader2
              className={cn(
                "w-3 h-3 mr-1 text-gray-500",
                (accountsLoading || syncingFbAccounts) && "animate-spin"
              )}
            />
            {isThai ? "รีเฟรช" : "Refresh"}
          </Button>
        </div>
      </div>

      {accountsLoading ? (
        <div className="flex items-center justify-center py-8 hover:bg-transparent">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {accountsSearch.trim()
              ? isThai
                ? "ไม่พบบัญชีที่ตรงกับคำค้นหา"
                : "No accounts match your search."
              : isThai
              ? "ยังไม่มีบัญชีโฆษณา"
              : "No ad accounts yet."}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {isThai
              ? "กำลังดึงบัญชีโฆษณาจาก Facebook อัตโนมัติ หากไม่มีบัญชี แสดงว่าไม่มีสิทธิ์ในบัญชีโฆษณาใด ๆ"
              : "Ad accounts are fetched automatically from Facebook. If nothing appears, this user may not have access to any ad accounts."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-white/60 bg-white/40 shadow-lg backdrop-blur-md rounded-xl dark:border-white/10 dark:bg-slate-800/40">
            <table className="w-full text-sm">
              <thead className="bg-white/20 backdrop-blur-sm dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {isThai ? "บัญชี" : "Account"}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {isThai ? "บัญชีโฆษณา" : "Account ID"}
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {isThai ? "สถานะ" : "Status"}
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {isThai ? "การใช้งาน" : "Active"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts
                  .slice(
                    (accountsPage - 1) * ACCOUNTS_PER_PAGE,
                    accountsPage * ACCOUNTS_PER_PAGE
                  )
                  .map((acc) => (
                    <tr
                      key={acc.id}
                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                            <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {acc.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                          {acc.accountId}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        {(() => {
                          const code =
                            fbStatuses[acc.accountId] ?? fbStatuses[acc.id];
                          const label = getAccountStatusLabel(acc);

                          if (code === 1) {
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 font-medium mx-auto">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                {label}
                              </span>
                            );
                          }
                          if (code === 2 || code === 7 || code === 3) {
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-0.5 font-medium mx-auto">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                {label}
                              </span>
                            );
                          }
                          if (code === 9) {
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200 text-xs px-2 py-0.5 font-medium mx-auto">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                                {label}
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 font-medium mx-auto border border-gray-100 dark:border-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        <Switch
                          className="scale-75 data-[state=checked]:bg-green-500"
                          checked={acc.isActive}
                          onCheckedChange={() => toggleAccount(acc)}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {filteredAccounts.length > ACCOUNTS_PER_PAGE && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isThai ? "แสดง" : "Showing"}{" "}
                {(accountsPage - 1) * ACCOUNTS_PER_PAGE + 1}–
                {Math.min(
                  accountsPage * ACCOUNTS_PER_PAGE,
                  filteredAccounts.length
                )}{" "}
                {isThai ? "จาก" : "of"} {filteredAccounts.length}{" "}
                {isThai ? "บัญชี" : "accounts"}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={accountsPage === 1}
                  onClick={() => setAccountsPage((p) => Math.max(1, p - 1))}
                >
                  {isThai ? "ก่อนหน้า" : "Previous"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={
                    accountsPage * ACCOUNTS_PER_PAGE >= filteredAccounts.length
                  }
                  onClick={() =>
                    setAccountsPage((p) =>
                      p * ACCOUNTS_PER_PAGE >= filteredAccounts.length
                        ? p
                        : p + 1
                    )
                  }
                >
                  {isThai ? "ถัดไป" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
