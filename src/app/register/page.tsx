import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta · Task Hive",
  description: "Crie sua conta Task Hive para organizar projetos e tarefas.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Comece a organizar seus projetos em minutos."
      wide
    >
      <RegisterForm inviteQuery={invite} />
    </AuthShell>
  );
}
