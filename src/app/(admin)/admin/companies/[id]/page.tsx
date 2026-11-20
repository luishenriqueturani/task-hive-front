import type { Metadata } from "next";
import { AdminCompanyDetail } from "@/components/admin/admin-company-detail";

export const metadata: Metadata = {
  title: "Empresa · Administração · Task Hive",
};

export default async function AdminCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminCompanyDetail companyId={id} />;
}
