import { ApiTokensView } from "@/components/settings/api-tokens-view";
import { requireSessionUser } from "@/lib/redirect-to-login";

export default async function ApiTokensPage() {
  await requireSessionUser("/settings/api-tokens");

  return <ApiTokensView />;
}
