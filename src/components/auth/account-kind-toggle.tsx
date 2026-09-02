"use client";

import { ACCOUNT_KIND, type AccountKind } from "@/lib/account-kind";
import { FaBuilding, FaUser } from "react-icons/fa6";

const OPTIONS: Array<{
  kind: AccountKind;
  label: string;
  hint: string;
  icon: typeof FaUser;
}> = [
  {
    kind: ACCOUNT_KIND.INDIVIDUAL,
    label: "Pessoa física",
    hint: "Projectos e tarefas avulsas",
    icon: FaUser,
  },
  {
    kind: ACCOUNT_KIND.COMPANY,
    label: "Pessoa jurídica",
    hint: "Só projectos da empresa",
    icon: FaBuilding,
  },
];

/** Toggle PF / CNPJ no cadastro. */
export function AccountKindToggle({
  value,
  onChange,
  disabled,
}: {
  value: AccountKind;
  onChange: (kind: AccountKind) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Tipo de conta" className="grid grid-cols-2 gap-2">
      {OPTIONS.map((option) => {
        const selected = value === option.kind;
        const Icon = option.icon;
        return (
          <button
            key={option.kind}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.kind)}
            className={`flex cursor-pointer flex-col items-start rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/50 disabled:cursor-not-allowed disabled:opacity-60 ${
              selected
                ? "border-app-accent bg-app-accent/10"
                : "border-app-border bg-app-surface/80 hover:bg-app-surface-elevated/90"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-app-text">
              <Icon className="h-3.5 w-3.5 text-app-accent" aria-hidden />
              {option.label}
            </span>
            <span className="mt-0.5 text-xs text-app-muted">{option.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
