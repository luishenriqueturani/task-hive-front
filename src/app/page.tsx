import { LandingPage } from "@/components/landing/landing-page";
import { getSessionUser } from "@/lib/session";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Task Hive",
  description:
    "Organize projetos, tarefas e tempo em um só lugar — kanban, convites e API.",
};

/**
 * Landing comercial pública. Com sessão, os CTAs passam a “Abrir painel”.
 */
export default async function Home() {
  const user = await getSessionUser();
  return <LandingPage signedIn={Boolean(user)} />;
}
