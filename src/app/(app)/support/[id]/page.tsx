import type { Metadata } from "next";
import { SupportThread } from "@/components/support/support-thread";
import { requireSessionUser } from "@/lib/redirect-to-login";

export const metadata: Metadata = {
  title: "Conversa · Suporte · Task Hive",
};

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSessionUser("/support");
  const { id } = await params;
  return (
    <SupportThread ticketId={id} mode="client" currentUserId={user.id} />
  );
}
