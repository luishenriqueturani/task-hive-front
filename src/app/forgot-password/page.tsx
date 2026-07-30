import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci a senha · Task Hive",
  description: "Solicite a redefinição da senha da sua conta Task Hive.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail e enviaremos as instruções de redefinição."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
