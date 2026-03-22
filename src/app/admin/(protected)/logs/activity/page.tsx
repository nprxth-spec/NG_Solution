import { Suspense } from "react";
import { AdminMainSkeleton } from "@/components/admin/AdminContentSkeleton";
import { ActivityLogsContent } from "./ActivityLogsContent";

export default function AdminActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AdminMainSkeleton />}>
      <ActivityLogsContent searchParams={searchParams} />
    </Suspense>
  );
}
