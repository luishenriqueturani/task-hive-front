import type { Metadata } from "next";
import { InviteAcceptView } from "@/components/invites/invite-accept-view";

export const metadata: Metadata = {
  title: "Convite · Task Hive",
  description: "Aceite o convite para um projecto no Task Hive.",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteAcceptView token={decodeURIComponent(token)} />;
}
