import { Suspense } from "react";
import { AdminMainSkeleton } from "@/components/admin/AdminContentSkeleton";
import { CentxoExportLogsContent } from "./CentxoExportLogsContent";

export default function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AdminMainSkeleton />}>
      <CentxoExportLogsContent searchParams={searchParams} />
    </Suspense>
  );
}
