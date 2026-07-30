import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha · Task Hive",
  description: "Defina uma nova senha para a sua conta Task Hive.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell
      title="Redefinir senha"
      subtitle="Defina a nova senha da sua conta."
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
