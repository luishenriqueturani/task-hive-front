import Link from "next/link";
import { PLAN_SETTINGS_HREF } from "@/lib/plan-quota";

/** Aviso visível junto aos botões desactivados por quota, com atalho aos planos. */
export function PlanLimitHint({
  className = "text-sm text-app-muted",
}: {
  className?: string;
}) {
  return (
    <p className={className}>
      Limite do plano.{" "}
      <Link
        href={PLAN_SETTINGS_HREF}
        className="font-medium text-app-accent hover:underline"
      >
        Ver planos
      </Link>
    </p>
  );
}
