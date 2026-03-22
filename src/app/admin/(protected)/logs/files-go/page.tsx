import { prisma } from "@/lib/db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPagination } from "@/components/admin/AdminPagination";

export default async function AdminFilesGoLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const pageSize = 25;

  const [logs, total] = await Promise.all([
    prisma.processingLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        user: { select: { id: true, email: true } },
        filename: true,
        originalFilename: true,
        invoiceDate: true,
        amount: true,
        currency: true,
        status: true,
        driveLink: true,
        createdAt: true,
      },
    }),
    prisma.processingLog.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminPageShell
      title="FilesGo Logs"
      description="ดูประวัติการประมวลผลใบเสร็จรับเงิน (Processing Logs) ของระบบ FilesGo"
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
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">ไฟล์เอกสาร</th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">ยอดเงิน</th>
                <th className="py-2.5 pr-4 pl-3 text-left font-medium border-b border-slate-200">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-sky-50/70">
                  <td className="py-2.5 pl-4 pr-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.createdAt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.user?.email ?? "-"}
                  </td>
                  <td className="py-2.5 px-3 border-t border-r border-slate-200">
                    <div className="flex flex-col gap-0.5 max-w-xs">
                      <span className="font-semibold truncate" title={log.filename}>{log.filename}</span>
                      <span className="text-slate-500 truncate" title={log.originalFilename ?? ""}>{log.originalFilename}</span>
                      {log.driveLink && (
                        <a href={log.driveLink} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
                          เปิดลิงก์ Drive
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono">{log.amount !== null ? log.amount : "-"} {log.currency}</span>
                      <span className="text-[10px] text-slate-500">Date: {log.invoiceDate ?? "-"}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 pl-3 whitespace-nowrap border-t border-slate-200">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${log.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-sm border-t border-slate-200">
                    ยังไม่มีข้อมูล Processing Log
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
