import type { Metadata } from "next";
import { AdminOverview } from "@/components/admin/admin-overview";

export const metadata: Metadata = {
  title: "Administração · Task Hive",
  description: "Resumo de utilizadores, empresas e tickets.",
};

export default function AdminIndexPage() {
  return <AdminOverview />;
}
