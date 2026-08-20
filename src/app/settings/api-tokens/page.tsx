import { redirect } from "next/navigation";
import { ApiTokensView } from "@/components/settings/api-tokens-view";
import { getSessionUser } from "@/lib/session";

export default async function ApiTokensPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/settings/api-tokens");

  return <ApiTokensView />;
}
