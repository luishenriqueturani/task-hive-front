import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TodosView } from "@/components/todos/todos-view";
import { canUseStandaloneTodos } from "@/lib/account-kind";
import { requireSessionUser } from "@/lib/redirect-to-login";

export const metadata: Metadata = {
  title: "Tarefas avulsas · Task Hive",
  description: "Tarefas pontuais e recorrentes no Task Hive.",
};

export default async function ToDoPage() {
  const user = await requireSessionUser("/to-do");
  if (!canUseStandaloneTodos(user.accountKind)) {
    redirect("/dashboard");
  }

  return <TodosView />;
}
