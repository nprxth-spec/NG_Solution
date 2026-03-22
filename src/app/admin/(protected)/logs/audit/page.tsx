import { prisma } from "@/lib/db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPagination } from "@/components/admin/AdminPagination";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const pageSize = 25;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        user: { select: { id: true, email: true } },
        type: true,
        description: true,
        ip: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminPageShell
      title="System Audit Logs"
      description="ดูประวัติการตรวจสอบการตั้งค่า บิลลิ่ง และพฤติกรรมเชิงลึกของระบบ"
    >
      <AdminCard>
        <p className="text-sm text-slate-500">
          แสดง {logs.length} จากทั้งหมด {total.toLocaleString("th-TH")} รายการ
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-[12px] border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-slate-600">
                <th className="py-2.5 pl-4 pr-3 text-left font-medium border-b border-r border-slate-200">เวลา</th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">ผู้ใช้</th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">ประเภท</th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">รายละเอียด</th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">Metadata / IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-amber-50/70">
                  <td className="py-2.5 pl-4 pr-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.createdAt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.user?.email ?? "-"}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    <span className="font-semibold text-amber-700 capitalize">
                      {log.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 border-t border-r border-slate-200 max-w-sm">
                    {log.description ?? "-"}
                  </td>
                  <td className="py-2.5 px-3 border-t border-slate-200">
                    <div className="flex flex-col gap-1 max-w-xs">
                      {log.ip && <span className="font-mono text-[10px] text-slate-500">IP: {log.ip}</span>}
                      <pre className="max-h-16 overflow-hidden whitespace-pre-wrap break-all text-[10px] text-slate-500">
                        {log.metadata ? JSON.stringify(log.metadata, null, 2) : "-"}
                      </pre>
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-sm border-t border-slate-200">
                    ยังไม่มีข้อมูล Audit Log
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          buildHref={(p) => `?page=${p}`}
        />
      </AdminCard>
    </AdminPageShell>
  );
}
