import Link from "next/link";
import { prisma } from "@/lib/db";
import { UserPlanActionsCell } from "./UserPlanActionsCell";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminScopeBadge } from "@/components/admin/AdminScopeBadge";
import {
  checkFacebookScopes,
  checkGoogleScopes,
} from "@/lib/oauth-scope-utils";

const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  pro: "bg-teal-100 text-teal-700",
  business: "bg-amber-100 text-amber-700",
};

export async function AdminUsersContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const pageSize = 25;

  const where: object = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        plan: true,
        credits: true,
        lastCreditsReset: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const userIds = users.map((u) => u.id);
  const oauthAccounts =
    userIds.length === 0
      ? []
      : await prisma.account.findMany({
          where: {
            userId: { in: userIds },
            provider: { in: ["google", "facebook"] },
          },
          select: { userId: true, provider: true, scope: true },
        });

  const scopeByUserId = new Map<
    string,
    {
      google?: string | null;
      facebook?: string | null;
      hasGoogle: boolean;
      hasFacebook: boolean;
    }
  >();
  for (const row of oauthAccounts) {
    const cur = scopeByUserId.get(row.userId) ?? {
      hasGoogle: false,
      hasFacebook: false,
    };
    if (row.provider === "google") {
      cur.hasGoogle = true;
      cur.google = row.scope;
    }
    if (row.provider === "facebook") {
      cur.hasFacebook = true;
      cur.facebook = row.scope;
    }
    scopeByUserId.set(row.userId, cur);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminPageShell
      title="Users & Credits"
      description="จัดการผู้ใช้, แพ็กเกจ, และเครดิตในระบบ"
    >
      <AdminCard className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-slate-500">
            ผู้ใช้ทั้งหมด{" "}
            <span className="font-semibold text-slate-800">
              {total.toLocaleString("th-TH")}
            </span>{" "}
            ราย
          </p>
          <form method="GET" className="flex items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="ค้นหาชื่อหรืออีเมล..."
              className="w-60 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            <button
              type="submit"
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              ค้นหา
            </button>
            {query && (
              <Link
                href="/admin/users"
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
              >
                ล้าง
              </Link>
            )}
          </form>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pl-4 pr-3 text-left font-medium">ผู้ใช้</th>
                <th className="py-2.5 px-3 text-left font-medium">สมัครเมื่อ</th>
                <th className="py-2.5 px-3 text-left font-medium">แพ็กเกจ</th>
                <th className="py-2.5 px-3 text-left font-medium">Google scope</th>
                <th className="py-2.5 px-3 text-left font-medium">Facebook scope</th>
                <th className="py-2.5 px-3 text-left font-medium">เครดิตคงเหลือ</th>
                <th className="py-2.5 px-3 text-left font-medium">รีเซ็ตล่าสุด</th>
                <th className="py-2.5 pr-4 pl-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                const sc = scopeByUserId.get(u.id);
                const googleScope = checkGoogleScopes(
                  sc?.google,
                  sc?.hasGoogle ?? false,
                );
                const facebookScope = checkFacebookScopes(
                  sc?.facebook,
                  sc?.hasFacebook ?? false,
                );
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-slate-100 last:border-0 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    } hover:bg-sky-50/70`}
                  >
                    <td className="py-2.5 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        {u.image ? (
                          <img
                            src={u.image}
                            alt={u.name ?? ""}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                            {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/users/${u.id}`}
                            prefetch
                            className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
                          >
                            {u.name ?? "-"}
                          </Link>
                          <p className="text-[11px] text-slate-400">{u.email ?? "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600">
                      {u.createdAt.toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          PLAN_BADGE[u.plan] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <AdminScopeBadge provider="Google" result={googleScope} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <AdminScopeBadge provider="Facebook" result={facebookScope} />
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-sm font-semibold ${
                          u.plan === "business" ? "text-amber-600" : "text-teal-600"
                        }`}
                      >
                        {u.plan === "business"
                          ? "∞"
                          : u.credits.toLocaleString("th-TH")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">
                      {u.lastCreditsReset
                        ? u.lastCreditsReset.toLocaleString("th-TH", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "-"}
                    </td>
                    <td className="py-2.5 pr-4 pl-3 text-right">
                      <UserPlanActionsCell
                        userId={u.id}
                        userName={u.name ?? u.email ?? "-"}
                        currentPlanId={u.plan}
                        currentPlanLabel={u.plan}
                        currentCredits={u.credits}
                      />
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 text-center text-slate-400 text-sm"
                  >
                    ไม่พบผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          buildHref={(p) =>
            `?page=${p}${query ? `&q=${encodeURIComponent(query)}` : ""}`
          }
        />

        <p className="text-[11px] text-slate-400 leading-relaxed">
          <span className="font-medium text-slate-500">คำอธิบายสโคป:</span> ครบ =
          ได้รับ scope ครบตามที่ระบบขอใน OAuth (Google: Drive + Sheets + โปรไฟล์,
          Facebook: โฆษณา + Pages ฯลฯ) — ขาด 3 = ยังไม่ครบ 3 รายการ (ชี้ที่ badge
          จะเห็นรายชื่อ scope) — ขีดกลาง = ยังไม่เชื่อม provider — ? =
          มีบัญชีแต่ไม่มีข้อมูล scope ใน DB
        </p>
      </AdminCard>
    </AdminPageShell>
  );
}
