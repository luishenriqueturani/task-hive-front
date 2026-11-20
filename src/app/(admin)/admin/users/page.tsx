import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminUsersView } from "@/components/admin/admin-users-view";

export const metadata: Metadata = {
  title: "Utilizadores · Administração · Task Hive",
  description: "Lista paginada de utilizadores, filtros e detalhe.",
};

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-48 animate-pulse rounded-2xl bg-app-surface-elevated/70"
          aria-hidden
        />
      }
    >
      <AdminUsersView />
    </Suspense>
  );
}
