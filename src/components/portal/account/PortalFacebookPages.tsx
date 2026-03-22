"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

interface FacebookPage {
  id: string;
  pageId: string;
  name: string;
  username?: string | null;
  pageStatus?: string | null;
  pictureUrl?: string | null;
  isActive: boolean;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const PAGES_PER_PAGE = 10;

export function PortalFacebookPages() {
  const { data: session } = useSession();
  const { language } = useTheme();
  const isThai = language === "th";

  const connectedProviders = session?.user?.connectedProviders ?? [];
  const hasFacebook = connectedProviders.includes("facebook");

  const [fbPages, setFbPages] = useState<FacebookPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesSearch, setPagesSearch] = useState("");
  const [syncingPages, setSyncingPages] = useState(false);
  const [pagesPage, setPagesPage] = useState(1);

  const syncFacebookPages = async (silent = false) => {
    setSyncingPages(true);
    try {
      const res = await fetch("/api/facebook/sync/pages", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to sync pages");

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
            isThai ? "ดึงเพจจาก Facebook เรียบร้อย" : "Pages synced successfully"
          );
        }
      }

      if (Array.isArray(data.pages)) {
        setFbPages(data.pages);
        setPagesPage(1);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to sync pages");
    } finally {
      setSyncingPages(false);
      setPagesLoading(false);
    }
  };

  const reloadFacebookPages = useCallback(async () => {
    setPagesLoading(true);
    try {
      const res = await fetch("/api/facebook-pages");
      const data = await res.json();
      if (Array.isArray(data)) setFbPages(data);
    } catch {
      toast.error(isThai ? "โหลดเพจไม่สำเร็จ" : "Failed to load pages");
    } finally {
      setPagesLoading(false);
    }
  }, [isThai]);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (hasFacebook) {
      reloadFacebookPages();
      syncFacebookPages(true);
    } else {
      setFbPages([]);
      setPagesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, hasFacebook]);

  useEffect(() => {
    setPagesPage(1);
  }, [pagesSearch]);

  const toggleFacebookPage = async (page: FacebookPage) => {
    const originalState = page.isActive;
    const newState = !originalState;

    setFbPages((p) =>
      p.map((a) => (a.id === page.id ? { ...a, isActive: newState } : a))
    );

    try {
      const res = await fetch("/api/facebook-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: page.id, isActive: newState }),
      });
      if (!res.ok) throw new Error("Failed to update page");
      const updated = await res.json();
      setFbPages((p) => p.map((a) => (a.id === page.id ? updated : a)));
    } catch (error) {
      setFbPages((p) =>
        p.map((a) =>
          a.id === page.id ? { ...a, isActive: originalState } : a
        )
      );
      toast.error(
        isThai ? "บันทึกการตั้งค่าไม่สำเร็จ" : "Failed to toggle page"
      );
    }
  };

  if (!hasFacebook && fbPages.length === 0) {
    return null;
  }

  const filteredPages = fbPages.filter(
    (p) =>
      p.name.toLowerCase().includes(pagesSearch.toLowerCase()) ||
      p.pageId.includes(pagesSearch) ||
      (p.username ?? "").toLowerCase().includes(pagesSearch.toLowerCase())
  );

  const pagedPages = filteredPages.slice(
    (pagesPage - 1) * PAGES_PER_PAGE,
    pagesPage * PAGES_PER_PAGE
  );

  return (
    <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700/80">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isThai ? "เพจเฟซบุ๊ก (Facebook Pages)" : "Facebook Pages"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isThai
            ? "เลือกเพจ Facebook ที่จะนำมาดึง Engagement สร้าง Audience"
            : "Select which Facebook pages to use for Custom Audiences."}
        </p>
        {syncingPages && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {isThai
              ? "กำลังดึงข้อมูลล่าสุดจาก Facebook..."
              : "Syncing latest data from Facebook..."}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder={
              isThai
                ? "ค้นหาชื่อเพจ หรือ Page ID..."
                : "Search by name or Page ID..."
            }
            value={pagesSearch}
            onChange={(e) => setPagesSearch(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => syncFacebookPages()}
            disabled={pagesLoading || syncingPages}
          >
            <Loader2
              className={cn(
                "w-3 h-3 mr-1 text-gray-500",
                (pagesLoading || syncingPages) && "animate-spin"
              )}
            />
            {isThai ? "รีเฟรช" : "Refresh"}
          </Button>
        </div>
      </div>

      {pagesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : fbPages.length === 0 ? (
        <div className="text-center py-8">
          <Globe className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isThai ? "ยังไม่มีเพจในระบบ" : "No pages yet."}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {isThai
              ? "กำลังดึงเพจจาก Facebook อัตโนมัติ หากไม่มีเพจ แสดงว่าไม่มีสิทธิ์ในเพจใด ๆ"
              : "Pages are fetched automatically from Facebook. If nothing appears, this user may not have access to any pages."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-white/60 bg-white/40 shadow-lg backdrop-blur-md rounded-xl dark:border-white/10 dark:bg-slate-800/40">
            <table className="w-full text-sm">
              <thead className="bg-white/20 backdrop-blur-sm dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {isThai ? "ชื่อเพจ" : "Page"}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Username
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {isThai ? "เพจ ID" : "Page ID"}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {isThai ? "สถานะ" : "Status"}
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {isThai ? "การใช้งาน" : "Active"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedPages.map((page) => (
                  <tr
                    key={page.id}
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <td className="px-4 py-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 shrink-0">
                          <img
                            src={
                              page.pictureUrl ||
                              `https://graph.facebook.com/${page.pageId}/picture?type=square`
                            }
                            alt={page.name}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-gray-100"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = "none";
                              const fallback =
                                img.nextElementSibling as HTMLElement | null;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <div
                            className="w-8 h-8 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/30 items-center justify-center text-[#1877F2] text-xs font-bold hidden"
                            aria-hidden
                          >
                            {page.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#1877F2] flex items-center justify-center border border-white dark:border-gray-900">
                            <FacebookIcon className="w-2 h-2 text-white" />
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[160px]">
                          {page.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-1.5 text-gray-500 dark:text-gray-400 text-xs">
                      {page.username ? (
                        <span className="font-mono">@{page.username}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-1.5 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {page.pageId}
                    </td>
                    <td className="px-4 py-1.5">
                      {page.pageStatus === "PUBLISHED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          {isThai ? "เผยแพร่" : "Published"}
                        </span>
                      ) : page.pageStatus === "UNPUBLISHED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs px-2 py-0.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                          {isThai ? "ไม่ได้เผยแพร่" : "Unpublished"}
                        </span>
                      ) : page.pageStatus ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5">
                          {page.pageStatus}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-1.5 text-center">
                      <Switch
                        className="scale-75 data-[state=checked]:bg-green-500"
                        checked={page.isActive}
                        onCheckedChange={() => toggleFacebookPage(page)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPages.length > PAGES_PER_PAGE && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isThai ? "แสดง" : "Showing"}{" "}
                {(pagesPage - 1) * PAGES_PER_PAGE + 1}–
                {Math.min(pagesPage * PAGES_PER_PAGE, filteredPages.length)}{" "}
                {isThai ? "จาก" : "of"} {filteredPages.length}{" "}
                {isThai ? "เพจ" : "pages"}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={pagesPage === 1}
                  onClick={() => setPagesPage((p) => Math.max(1, p - 1))}
                >
                  {isThai ? "ก่อนหน้า" : "Previous"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={
                    pagesPage * PAGES_PER_PAGE >= filteredPages.length
                  }
                  onClick={() =>
                    setPagesPage((p) =>
                      p * PAGES_PER_PAGE >= filteredPages.length ? p : p + 1
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
