import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDateRange, type DateFilter } from "@/lib/admin-date-range";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPagination } from "@/components/admin/AdminPagination";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const rawPageSize = Number(sp.pageSize ?? "25") || 25;
  const allowedPageSizes = [25, 50, 100, 200];
  const pageSize = allowedPageSizes.includes(rawPageSize)
    ? rawPageSize
    : 25;

  const dateFilter = (sp.date as DateFilter | undefined) ?? "all";
  const typeFilter = (sp.type as string | undefined) ?? "all";
  const statusFilter = (sp.status as string | undefined) ?? "all";
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;

  const range = getDateRange(dateFilter, from, to);

  const where: any = {};
  if (range && (range.gte || range.lte)) {
    where.createdAt = {
      ...(range.gte ? { gte: range.gte } : {}),
      ...(range.lte ? { lte: range.lte } : {}),
    };
  }
  if (typeFilter === "manual") {
    where.exportType = "manual";
  } else if (typeFilter === "auto") {
    where.exportType = "auto";
  }
  if (statusFilter === "success") {
    where.status = "success";
  } else if (statusFilter === "error") {
    where.status = "error";
  }

  const [logs, total] = await Promise.all([
    prisma.exportLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        user: { select: { id: true, email: true } },
        exportType: true,
        configName: true,
        status: true,
        error: true,
        createdAt: true,
        details: true,
      },
    }),
    prisma.exportLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminPageShell
      title="Centxo Export Logs"
      description="ดูประวัติการส่งออกข้อมูลของผู้ใช้ และสถานะล่าสุด"
    >
      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            แสดง {logs.length.toString()} จากทั้งหมด{" "}
            {total.toLocaleString("th-TH")} รายการ
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Date filters */}
            <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-50 px-1.5 py-1">
              {[
                { key: "all", label: "ทั้งหมด" },
                { key: "today", label: "วันนี้" },
                { key: "yesterday", label: "เมื่อวาน" },
                { key: "this_month", label: "เดือนนี้" },
                { key: "last_month", label: "เดือนที่ผ่านมา" },
                { key: "last_60_days", label: "60 วัน" },
                { key: "last_90_days", label: "90 วัน" },
              ].map((f) => (
                <Link
                  key={f.key}
                  href={`?date=${f.key}&page=1&pageSize=${pageSize}&type=${typeFilter}&status=${statusFilter}`}
                  className={`cursor-pointer rounded-full px-2.5 py-0.5 ${
                    dateFilter === f.key
                      ? "bg-slate-900 text-slate-50"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
            {/* Custom range */}
            <form
              method="GET"
              className="flex items-center gap-1 text-xs"
            >
              <input type="hidden" name="date" value="custom" />
              <input type="hidden" name="type" value={typeFilter} />
              <input type="hidden" name="status" value={statusFilter} />
              <input
                type="date"
                name="from"
                defaultValue={from}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                name="to"
                defaultValue={to}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              />
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="pageSize" value={pageSize} />
              <button
                type="submit"
                className="ml-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ใช้ช่วงวันที่
              </button>
            </form>
            {/* Type & status filters */}
            <form method="GET" className="flex items-center gap-2 text-xs">
              <input type="hidden" name="date" value={dateFilter} />
              {from && <input type="hidden" name="from" value={from} />}
              {to && <input type="hidden" name="to" value={to} />}
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="pageSize" value={pageSize} />
              <span className="text-slate-500">ประเภท</span>
              <select
                name="type"
                defaultValue={typeFilter}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              >
                <option value="all">ทั้งหมด</option>
                <option value="manual">Manual</option>
                <option value="auto">Auto</option>
              </select>
              <span className="text-slate-500">สถานะ</span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              >
                <option value="all">ทั้งหมด</option>
                <option value="success">สำเร็จ</option>
                <option value="error">ผิดพลาด</option>
              </select>
              <button
                type="submit"
                className="ml-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                กรอง
              </button>
            </form>
            {/* Page size */}
            <form method="GET" className="flex items-center gap-1 text-xs">
              <input type="hidden" name="date" value={dateFilter} />
              {from && <input type="hidden" name="from" value={from} />}
              {to && <input type="hidden" name="to" value={to} />}
              <input type="hidden" name="type" value={typeFilter} />
              <input type="hidden" name="status" value={statusFilter} />
              <span className="text-slate-500">แสดงต่อหน้า</span>
              <select
                name="pageSize"
                defaultValue={pageSize}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              >
                {allowedPageSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input type="hidden" name="page" value="1" />
              <button
                type="submit"
                className="ml-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ตกลง
              </button>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-slate-600">
                <th className="py-2.5 pl-4 pr-3 text-left font-medium border-b border-r border-slate-200">
                  เวลา
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  ผู้ใช้
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  ประเภท
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  คอนฟิก
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  IP / Path
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  สถานะ
                </th>
                <th className="py-2.5 pr-4 pl-3 text-left font-medium border-b border-slate-200">
                  ข้อความผิดพลาด
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                const meta: any =
                  (log as any).details && typeof (log as any).details === "object"
                    ? (log as any).details.meta ?? null
                    : null;
                const ip = meta?.ip ?? "-";
                const sourcePath = meta?.sourcePath ?? "";
                return (
                <tr key={log.id} className="hover:bg-sky-50/70">
                  <td className="py-2.5 pl-4 pr-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.createdAt.toLocaleString("th-TH", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.user?.email ?? "-"}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.exportType}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.configName ?? "-"}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px]">{ip}</span>
                      {sourcePath && (
                        <span className="text-[11px] text-slate-500">
                          {sourcePath}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    <span
                      className={
                        log.status === "success"
                          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100"
                          : "inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-100"
                      }
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 pl-3 max-w-xs truncate text-slate-500 border-t border-slate-200">
                    {log.error ?? "-"}
                  </td>
                </tr>
              )})}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-slate-400 text-sm border-t border-slate-200"
                  >
                    ยังไม่มี logs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          buildHref={(p) => `?page=${p}&pageSize=${pageSize}&date=${dateFilter}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}&type=${typeFilter}&status=${statusFilter}`}
        />
      </AdminCard>
    </AdminPageShell>
  );
}

