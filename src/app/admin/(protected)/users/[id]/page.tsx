import { Suspense } from "react";
import { AdminMainSkeleton } from "@/components/admin/AdminContentSkeleton";
import { AdminUserDetailContent } from "./AdminUserDetailContent";

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<AdminMainSkeleton />}>
      <AdminUserDetailContent params={params} />
    </Suspense>
  );
}
