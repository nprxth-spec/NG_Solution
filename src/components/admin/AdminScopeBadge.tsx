import type { ScopeCheckResult } from "@/lib/oauth-scope-utils";

function titleLines(provider: "Google" | "Facebook", r: ScopeCheckResult): string {
  if (!r.linked) {
    return `${provider}: ยังไม่ได้เชื่อมบัญชี`;
  }
  if (r.scopeUnknown) {
    return `${provider}: มีบัญชีแล้วแต่ไม่มีข้อมูล scope ใน DB — ให้ผู้ใช้ล็อกอิน Google ใหม่หรือตรวจ Account.scope`;
  }
  if (r.complete) {
    return `${provider}: ครบ ${r.requiredCount}/${r.requiredCount} scope ที่ระบบต้องการ`;
  }
  const missing = r.missing.join(", ");
  return `${provider}: ขาด ${r.missing.length} scope — ${missing}`;
}

export function AdminScopeBadge({
  provider,
  result,
}: {
  provider: "Google" | "Facebook";
  result: ScopeCheckResult;
}) {
  const title = titleLines(provider, result);

  if (!result.linked) {
    return (
      <span
        title={title}
        className="inline-flex items-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400"
      >
        —
      </span>
    );
  }

  if (result.scopeUnknown) {
    return (
      <span
        title={title}
        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
      >
        ?
      </span>
    );
  }

  if (result.complete) {
    return (
      <span
        title={title}
        className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
      >
        ครบ
      </span>
    );
  }

  return (
    <span
      title={title}
      className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900"
    >
      ขาด {result.missing.length}
    </span>
  );
}
