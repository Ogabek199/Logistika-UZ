"use client";

import { WifiOff } from "lucide-react";
import { StatusPage } from "@/components/status-page";
import { useT } from "@/i18n";

export default function OfflinePage() {
  const t = useT();

  return (
    <StatusPage
      code="OFFLINE"
      title={t("offline.title")}
      description={t("offline.description")}
      icon={<WifiOff className="h-9 w-9" strokeWidth={1.75} />}
      primaryHref="/"
      primaryLabel={t("common.backHome")}
      tone="signal"
    />
  );
}
