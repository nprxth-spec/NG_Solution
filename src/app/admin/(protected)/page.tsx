import { Suspense } from "react";
import { AdminMainSkeleton } from "@/components/admin/AdminContentSkeleton";
import { AdminDashboardContent } from "./AdminDashboardContent";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminMainSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
