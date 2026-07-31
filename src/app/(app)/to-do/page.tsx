import type { Metadata } from "next";
import { TodosView } from "@/components/todos/todos-view";

export const metadata: Metadata = {
  title: "Tarefas avulsas · Task Hive",
  description: "Tarefas pontuais e recorrentes no Task Hive.",
};

export default function ToDoPage() {
  return <TodosView />;
}
