"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PLAN_OPTIONS: { id: "free" | "pro" | "business"; label: string; credits: number | null }[] = [
  { id: "free", label: "Free (100 credits)", credits: 100 },
  { id: "pro", label: "Pro (5,000 credits)", credits: 5000 },
  { id: "business", label: "Business (Unlimited)", credits: null },
];

export function UserPlanActionsCell({
  userId,
  userName,
  currentPlanId,
  currentPlanLabel,
  currentCredits,
}: {
  userId: string;
  userName: string;
  currentPlanId: string;
  currentPlanLabel: string;
  currentCredits: number;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "credits">("plan");
  const [planId, setPlanId] = useState<"free" | "pro" | "business">(
    (["free", "pro", "business"].includes(currentPlanId)
      ? currentPlanId
      : "free") as "free" | "pro" | "business",
  );
  const [creditAdjust, setCreditAdjust] = useState<number>(0);
  const [creditMode, setCreditMode] = useState<"add" | "set">("add");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setSuccess(null);
    setActiveTab("plan");
    setDialogOpen(true);
  };

  const handleChangePlan = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      const formData = new FormData();
      formData.append("planId", planId);
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: { "x-admin-ajax": "1" },
        body: formData,
      });
      let payload: any = null;
      try { payload = await res.json(); } catch { payload = null; }
      if (res.ok && payload?.ok) {
        setSuccess("เปลี่ยนแพ็กเกจสำเร็จ");
        router.refresh();
      } else {
        setError(payload?.error ?? "ไม่สามารถเปลี่ยนแพ็กเกจได้");
      }
    });
  };

  const handleAdjustCredits = () => {
    if (isNaN(creditAdjust)) {
      setError("กรุณากรอกตัวเลข");
      return;
    }
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-ajax": "1" },
        body: JSON.stringify({ amount: creditAdjust, mode: creditMode }),
      });
      let payload: any = null;
      try { payload = await res.json(); } catch { payload = null; }
      if (res.ok && payload?.ok) {
        setSuccess("อัปเดตเครดิตสำเร็จ");
        setCreditAdjust(0);
        router.refresh();
      } else {
        setError(payload?.error ?? "ไม่สามารถปรับเครดิตได้");
      }
    });
  };

  return (
    <div className="inline-flex items-center justify-end">
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
      >
        จัดการ
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">จัดการผู้ใช้</DialogTitle>
            <DialogDescription className="text-sm">📍 {userName}</DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="inline-flex rounded-full bg-slate-100 p-1 gap-1 mb-2">
            <button
              type="button"
              onClick={() => setActiveTab("plan")}
              className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${activeTab === "plan" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              แพ็กเกจ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("credits")}
              className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${activeTab === "credits" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              เครดิต (ปัจจุบัน: {currentCredits.toLocaleString()})
            </button>
          </div>

          {activeTab === "plan" && (
            <div className="space-y-3 py-1">
              <p className="text-xs text-slate-500">
                แพ็กเกจปัจจุบัน:{" "}
                <span className="font-medium text-slate-800 capitalize">{currentPlanLabel}</span>
              </p>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-500">เลือกแพ็กเกจใหม่:</span>
                <div className="flex flex-col gap-1.5">
                  {PLAN_OPTIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanId(p.id)}
                      className={`w-full cursor-pointer rounded-xl px-4 py-2 text-xs text-left border transition-all ${
                        planId === p.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                การเปลี่ยนแพ็กเกจจะรีเซ็ตเครดิตผู้ใช้ตามแผนที่เลือก
              </p>
            </div>
          )}

          {activeTab === "credits" && (
            <div className="space-y-3 py-1">
              <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setCreditMode("add")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium cursor-pointer ${creditMode === "add" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
                >
                  ➕ เพิ่ม / ลด
                </button>
                <button
                  type="button"
                  onClick={() => setCreditMode("set")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium cursor-pointer ${creditMode === "set" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
                >
                  ✏️ ตั้งค่าโดยตรง
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  {creditMode === "add" ? "จำนวนที่ต้องการเพิ่ม (ลบ = ลดเครดิต)" : "ค่าเครดิตที่ต้องการตั้ง"}
                </label>
                <input
                  type="number"
                  value={creditAdjust}
                  onChange={(e) => setCreditAdjust(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder={creditMode === "add" ? "เช่น 500 หรือ -100" : "เช่น 1000"}
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          {success && <p className="text-xs text-emerald-600 mt-1">{success}</p>}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs"
              onClick={activeTab === "plan" ? handleChangePlan : handleAdjustCredits}
              disabled={isPending}
            >
              {isPending ? "กำลังบันทึก..." : activeTab === "plan" ? "ยืนยันเปลี่ยนแพ็กเกจ" : "บันทึกเครดิต"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
