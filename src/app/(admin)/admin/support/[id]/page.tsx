import type { Metadata } from "next";
import { SupportThread } from "@/components/support/support-thread";
import { requireAdmin } from "@/lib/redirect-to-login";

export const metadata: Metadata = {
  title: "Ticket · Suporte · Administração · Task Hive",
};

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin("/admin/support");
  const { id } = await params;
  return (
    <SupportThread ticketId={id} mode="admin" currentUserId={user.id} />
  );
}
