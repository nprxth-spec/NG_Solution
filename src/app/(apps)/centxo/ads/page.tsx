"use client";

import { useSearchParams } from "next/navigation";
import { AdsTab } from "@/components/centxo/AdsTab";
import { AdAccountsTab } from "@/components/centxo/AdAccountsTab";
import { CreateTab } from "@/components/centxo/CreateTab";
import { ToolsTab } from "@/components/centxo/ToolsTab";
import { ExportTab } from "@/components/centxo/ExportTab";
import { ExportAdsTab } from "@/components/centxo/ExportAdsTab";

export default function CentxoDashboardOrchestrator() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "ads";

  return (
    <>
      {tab === "ads" && <AdsTab />}
      {tab === "ad_accounts" && <AdAccountsTab />}
      {tab === "create" && <CreateTab />}
      {tab === "tools" && <ToolsTab />}
      {tab === "export" && <ExportTab />}
      {tab === "export_ads" && <ExportAdsTab />}
    </>
  );
}
