import type { Metadata } from "next";
import { AdminUserDetail } from "@/components/admin/admin-user-detail";

export const metadata: Metadata = {
  title: "Utilizador · Administração · Task Hive",
};

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminUserDetail userId={id} />;
}
