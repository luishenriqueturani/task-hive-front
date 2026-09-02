import type { Metadata } from "next";
import { AdminPlansView } from "@/components/admin/admin-plans-view";

export const metadata: Metadata = {
  title: "Planos · Administração · Task Hive",
  description: "Catálogo de planos, quotas e benefícios.",
};

export default function AdminPlansPage() {
  return <AdminPlansView />;
}
