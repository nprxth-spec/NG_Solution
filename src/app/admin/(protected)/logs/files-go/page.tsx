import { Suspense } from "react";
import { AdminMainSkeleton } from "@/components/admin/AdminContentSkeleton";
import { FilesGoLogsContent } from "./FilesGoLogsContent";

export default function AdminFilesGoLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AdminMainSkeleton />}>
      <FilesGoLogsContent searchParams={searchParams} />
    </Suspense>
  );
}
