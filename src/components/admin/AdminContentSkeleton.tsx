/** Fallback ขณะรอ RSC / DB — ใช้กับ Suspense ในแอดมิน */
export function AdminMainSkeleton() {
  return (
    <div className="mx-auto w-full px-4 md:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-56 max-w-[80%] rounded-lg bg-slate-200/90" />
      <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm min-h-[280px]">
        <div className="h-9 w-full rounded-lg bg-slate-100 mb-4" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-9 w-full rounded-md bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
