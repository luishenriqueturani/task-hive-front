import { LoginView } from "@/components/auth/login-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar · Task Hive",
  description: "Faça login na sua conta Task Hive.",
};

export default function LoginPage() {
  return <LoginView />;
}
