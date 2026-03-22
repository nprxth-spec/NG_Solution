"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

function NavInner({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={cn(
        "rounded-lg px-3 py-2 flex items-center justify-between transition-[opacity,background-color] duration-150",
        active
          ? "border-l-[3px] border-sky-600 bg-sky-50/90 text-slate-900 font-medium"
          : "border-l-[3px] border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        pending && "opacity-65",
      )}
    >
      <span>{label}</span>
      {pending && (
        <span
          className="ml-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"
          aria-hidden
        />
      )}
    </span>
  );
}

export function AdminNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} prefetch className="block outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 rounded-lg">
      <NavInner label={label} active={active} />
    </Link>
  );
}
