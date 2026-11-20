import type { Metadata } from "next";
import { ApiTokensView } from "@/components/settings/api-tokens-view";

export const metadata: Metadata = {
  title: "Tokens de API · Task Hive",
  description: "Chaves pessoais para agentes e integrações.",
};

export default function ApiTokensPage() {
  return <ApiTokensView />;
}
