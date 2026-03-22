"use client";

import { useSearchParams } from "next/navigation";
import { UploadTab } from "@/components/files-go/UploadTab";
import { HistoryTab } from "@/components/files-go/HistoryTab";
import { IntegrationsTab } from "@/components/files-go/IntegrationsTab";
import { NamingTab } from "@/components/files-go/NamingTab";

export default function FilesGoDashboardOrchestrator() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "upload";

  return (
    <>
      {tab === "upload" && <UploadTab />}
      {tab === "history" && <HistoryTab />}
      {tab === "integrations" && <IntegrationsTab />}
      {tab === "naming" && <NamingTab />}
    </>
  );
}
