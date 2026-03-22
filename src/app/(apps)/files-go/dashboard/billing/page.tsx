"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Legacy FilesGo billing URL.
// Billing and plans are now managed centrally from /dashboard (Plans & billing).
export default function LegacyFilesGoBillingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?menu=billing");
  }, [router]);

  return null;
}

