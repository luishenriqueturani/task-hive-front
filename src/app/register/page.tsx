import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta · Task Hive",
  description: "Crie sua conta Task Hive para organizar projetos e tarefas.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Comece a organizar seus projetos em minutos."
    >
      <RegisterForm />
    </AuthShell>
  );
}
