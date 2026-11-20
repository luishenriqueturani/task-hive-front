import type { Metadata } from "next";
import { Suspense } from "react";
import { SupportInbox } from "@/components/support/support-inbox";

export const metadata: Metadata = {
  title: "Suporte · Task Hive",
  description: "Tickets de suporte e conversas com a equipa.",
};

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-48 animate-pulse rounded-2xl bg-app-surface-elevated/70"
          aria-hidden
        />
      }
    >
      <SupportInbox mode="client" />
    </Suspense>
  );
}
