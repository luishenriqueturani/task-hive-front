import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminCompaniesView } from "@/components/admin/admin-companies-view";

export const metadata: Metadata = {
  title: "Empresas · Administração · Task Hive",
  description: "Lista paginada de empresas, filtros e detalhe.",
};

export default function AdminCompaniesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-48 animate-pulse rounded-2xl bg-app-surface-elevated/70"
          aria-hidden
        />
      }
    >
      <AdminCompaniesView />
    </Suspense>
  );
}
