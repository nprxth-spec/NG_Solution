import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminCardProps {
  children: ReactNode;
  className?: string;
}

export function AdminCard({ children, className }: AdminCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white shadow-sm border border-slate-200 p-5 space-y-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
