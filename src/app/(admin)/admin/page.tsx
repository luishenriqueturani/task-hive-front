import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Administração · Task Hive",
};

export default function AdminIndexPage() {
  redirect("/admin/plans");
}
