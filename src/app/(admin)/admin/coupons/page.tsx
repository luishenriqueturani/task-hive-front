import type { Metadata } from "next";
import { AdminCouponsView } from "@/components/admin/admin-coupons-view";

export const metadata: Metadata = {
  title: "Cupons · Administração · Task Hive",
  description: "Cupons de desconto e histórico de redemptions.",
};

export default function AdminCouponsPage() {
  return <AdminCouponsView />;
}
