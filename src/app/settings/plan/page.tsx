import type { Metadata } from "next";
import { PlanSettingsView } from "@/components/settings/plan-settings-view";
import { requireSessionUser } from "@/lib/redirect-to-login";

export const metadata: Metadata = {
  title: "Plano · Task Hive",
  description: "Plano actual, uso das quotas e comparação de upgrade.",
};

export default async function PlanSettingsPage() {
  await requireSessionUser("/settings/plan");
  return <PlanSettingsView />;
}
