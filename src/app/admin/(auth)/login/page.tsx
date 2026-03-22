"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster, toast } from "sonner";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configError = searchParams.get("error") === "config";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "ไม่สามารถเข้าสู่ระบบได้");
      } else {
        toast.success("เข้าสู่ระบบผู้ดูแลสำเร็จ");
        router.push("/admin");
      }
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
      <h1 className="text-lg font-semibold mb-2">Admin Monitor</h1>
      <p className="text-xs text-slate-400 mb-6">
        เข้าสู่ระบบสำหรับผู้ดูแลระบบเท่านั้น
      </p>
      {configError && (
        <div
          className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
          role="alert"
        >
          เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า{" "}
          <code className="rounded bg-slate-800 px-1 py-0.5 text-[10px]">
            ADMIN_SESSION_TOKEN
          </code>{" "}
          ใน production — ติดต่อผู้ดูแลระบบ
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Username
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Password
          </label>
          <input
            type="password"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-sky-500 py-2 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-60 cursor-pointer"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบผู้ดูแล"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <Toaster richColors position="top-right" />
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-400">
            กำลังโหลด…
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
