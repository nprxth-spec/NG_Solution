import { Suspense } from "react";
import { AdminMainSkeleton } from "@/components/admin/AdminContentSkeleton";
import { AdminUsersContent } from "./AdminUsersContent";

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AdminMainSkeleton />}>
      <AdminUsersContent searchParams={searchParams} />
    </Suspense>
  );
}
