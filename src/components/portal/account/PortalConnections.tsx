"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Plus, X, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import { PortalManagerAccounts } from "./PortalManagerAccounts";
import { PortalFacebookPages } from "./PortalFacebookPages";

interface FbConnection {
  id: string;
  providerAccountId: string;
  name: string | null;
  email: string | null;
  picture: string | null;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function PortalConnections() {
  const { data: session, update: updateSession } = useSession();
  const { language } = useTheme();
  const isThai = language === "th";

  const [fbConnections, setFbConnections] = useState<FbConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const connectedProviders = session?.user?.connectedProviders ?? [];
  const hasGoogle = connectedProviders.includes("google");
  const hasFacebook = connectedProviders.includes("facebook") || fbConnections.length > 0;

  const reloadFbConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const res = await fetch("/api/facebook-connections");
      const data = await res.json();
      if (Array.isArray(data)) setFbConnections(data);
    } catch {
      toast.error(isThai ? "โหลดการเชื่อมต่อ Facebook ไม่สำเร็จ" : "Failed to load Facebook connections");
    } finally {
      setConnectionsLoading(false);
    }
  }, [isThai]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle success/error from custom Facebook link OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "linked") {
      toast.success(isThai ? "เชื่อมต่อ Facebook ใหม่เรียบร้อย" : "Facebook account linked successfully");
      updateSession?.();
      router.replace("/dashboard?menu=connections");
    } else if (success === "reconnected") {
      toast.success(isThai ? "อัปเดต Token Facebook เรียบร้อย" : "Facebook token refreshed");
      updateSession?.();
      router.replace("/dashboard?menu=connections");
    } else if (error === "already_linked_to_another_user") {
      toast.error(isThai ? "บัญชี Facebook นี้ถูกเชื่อมต่อกับ User อื่นแล้ว" : "This Facebook account is already linked to another user");
      router.replace("/dashboard?menu=connections");
    } else if (error) {
      toast.error(isThai ? "ไม่สามารถเชื่อมต่อ Facebook ได้" : "Failed to link Facebook account");
      router.replace("/dashboard?menu=connections");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isThai, updateSession, router]);

  useEffect(() => {
    reloadFbConnections();
  }, [reloadFbConnections]);

  const disconnectFacebook = async (id: string) => {
    setDisconnecting(id);
    try {
      const res = await fetch("/api/facebook-connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed");
      setFbConnections((prev) => prev.filter((c) => c.id !== id));
      updateSession();
      toast.success(isThai ? "ยกเลิกการเชื่อมต่อ Facebook แล้ว" : "Facebook disconnected");
    } catch {
      toast.error(isThai ? "เกิดข้อผิดพลาด" : "Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Row */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-white/60 bg-white/40 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700">
            <GoogleIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Google</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasGoogle
                ? isThai ? "เชื่อมต่อแล้ว — ใช้สำหรับ Google Sheets" : "Connected — used for Google Sheets"
                : isThai ? "ยังไม่ได้เชื่อมต่อ" : "Not connected yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasGoogle ? (
            <Badge variant="success" className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 border-none">
              <CheckCircle2 className="w-3 h-3" />
              {isThai ? "เชื่อมต่อแล้ว" : "Connected"}
            </Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={() => signIn("google", { callbackUrl: "/dashboard?menu=connections" })}>
              {isThai ? "เชื่อมต่อ" : "Connect"}
            </Button>
          )}
        </div>
      </div>

      {/* Facebook Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 dark:bg-teal-900/20">
              <FacebookIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Facebook</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isThai
                  ? `เชื่อมต่ออยู่ ${fbConnections.length} บัญชี`
                  : `${fbConnections.length} account${fbConnections.length !== 1 ? 's' : ''} connected`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs gap-1.5 bg-white text-[#1877F2] border-teal-200 hover:bg-teal-50 dark:bg-transparent dark:text-[#9ec5ff] dark:border-teal-800 dark:hover:bg-teal-950/40"
            onClick={() => { window.location.href = "/api/auth/link-facebook"; }}
          >
            <Plus className="w-3 h-3" />
            {isThai ? "เพิ่มบัญชี Facebook" : "Add Facebook Account"}
          </Button>
        </div>

        {connectionsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : fbConnections.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/60 rounded-xl bg-white/20 backdrop-blur-sm dark:bg-slate-800/20 dark:border-white/10">
            <FacebookIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isThai ? "ยังไม่ได้เชื่อมต่อ Facebook" : "No Facebook accounts connected"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isThai ? 'กดปุ่ม "เพิ่มบัญชี Facebook" เพื่อเริ่มต้น' : 'Click "Add Facebook Account" to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/60 rounded-xl bg-white/40 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {isThai ? "บัญชี Facebook" : "Facebook Account"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {isThai ? "อีเมล" : "Email"}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {isThai ? "จัดการ" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fbConnections.map((conn) => (
                  <tr key={conn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 shrink-0 shadow-sm rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          {conn.picture ? (
                            <img src={conn.picture} alt={conn.name ?? ""} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] text-xs font-bold">
                              {(conn.name ?? "F").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                            <FacebookIcon className="w-2.5 h-2.5 text-white" />
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{conn.name ?? "—"}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">{conn.providerAccountId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {conn.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        disabled={disconnecting === conn.id}
                        onClick={() => disconnectFacebook(conn.id)}
                      >
                        {disconnecting === conn.id ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                        ) : (
                          <X className="w-3.5 h-3.5 mr-1" />
                        )}
                        <span>{isThai ? "ยกเลิกการเชื่อมต่อ" : "Disconnect"}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasFacebook && (
        <>
          <PortalManagerAccounts />
          <PortalFacebookPages />
        </>
      )}

      <div className="p-4 bg-teal-50/40 backdrop-blur-sm dark:bg-teal-900/10 rounded-xl border border-teal-100/60 dark:border-teal-900/30">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 bg-teal-100 dark:bg-teal-800/40 rounded-lg shrink-0">
            <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="space-y-1 text-sm text-teal-800 dark:text-teal-300">
             <p className="font-semibold">{isThai ? "ความปลอดภัยของข้อมูล" : "Data Security & Privacy"}</p>
             <p className="opacity-80">
              {isThai
                ? "เราใช้ Facebook Graph API ล่าสุดเพื่อดึงข้อมูลอย่างปลอดภัย โทเค็นทั้งหมดถูกเข้ารหัส ไม่มีใครสามารถเข้าถึงบัญชีส่วนตัวของคุณได้ 100%"
                : "We integrate with the latest Facebook Graph API securely. All tokens are encrypted, and we never have access to your personal login credentials."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
