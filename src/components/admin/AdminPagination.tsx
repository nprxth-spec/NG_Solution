import Link from "next/link";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  /** Returns the href string for a given page number */
  buildHref: (page: number) => string;
}

export function AdminPagination({
  page,
  totalPages,
  buildHref,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const linkCls = (disabled: boolean) =>
    `px-3 py-1.5 rounded-md border border-slate-200 text-xs cursor-pointer transition-colors ${
      disabled
        ? "opacity-40 pointer-events-none bg-slate-50 text-slate-400"
        : "bg-white text-slate-700 hover:bg-slate-50"
    }`;

  return (
    <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
      <span>
        หน้า {page} จาก {totalPages}
      </span>
      <div className="inline-flex gap-1">
        <Link href={buildHref(1)} className={linkCls(page === 1)}>
          หน้าแรก
        </Link>
        <Link href={buildHref(Math.max(1, page - 1))} className={linkCls(page === 1)}>
          ก่อนหน้า
        </Link>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          className={linkCls(page === totalPages)}
        >
          ถัดไป
        </Link>
        <Link href={buildHref(totalPages)} className={linkCls(page === totalPages)}>
          หน้าสุดท้าย
        </Link>
      </div>
    </div>
  );
}
