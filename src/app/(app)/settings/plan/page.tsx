import type { Metadata } from "next";
import { PlanSettingsView } from "@/components/settings/plan-settings-view";

export const metadata: Metadata = {
  title: "Plano · Task Hive",
  description: "Plano actual, uso das quotas e comparação de upgrade.",
};

export default function PlanSettingsPage() {
  return <PlanSettingsView />;
}
