import type { Metadata } from "next";
import { Suspense } from "react";
import { SupportInbox } from "@/components/support/support-inbox";

export const metadata: Metadata = {
  title: "Suporte · Administração · Task Hive",
  description: "Fila global de tickets de suporte.",
};

export default function AdminSupportPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-48 animate-pulse rounded-2xl bg-app-surface-elevated/70"
          aria-hidden
        />
      }
    >
      <SupportInbox mode="admin" />
    </Suspense>
  );
}
