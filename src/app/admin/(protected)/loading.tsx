export default function AdminProtectedLoading() {
  return (
    <div className="relative mx-auto w-full px-4 md:px-6 py-8 space-y-6 animate-pulse">
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 z-[100] h-0.5 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-90 animate-pulse"
        aria-hidden
      />
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
      <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
        <div className="h-10 w-full rounded-lg bg-slate-100" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-full rounded-md bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
