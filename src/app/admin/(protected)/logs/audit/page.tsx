import { Suspense } from "react";
import { AdminMainSkeleton } from "@/components/admin/AdminContentSkeleton";
import { AuditLogsContent } from "./AuditLogsContent";

export default function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AdminMainSkeleton />}>
      <AuditLogsContent searchParams={searchParams} />
    </Suspense>
  );
}
