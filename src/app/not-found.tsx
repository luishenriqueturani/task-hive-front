import { ErrorScreen } from "@/components/layout/error-screen";

export default function NotFound() {
  return (
    <ErrorScreen
      code={404}
      title="Página não encontrada"
      description="Este endereço não existe ou foi movido. Volta ao painel ou escolhe outra opção no menu."
    />
  );
}
