/** Tipo de conta no cadastro e na sessão (espelha o enum do backend). */
export const ACCOUNT_KIND = {
  INDIVIDUAL: "INDIVIDUAL",
  COMPANY: "COMPANY",
} as const;

export type AccountKind = (typeof ACCOUNT_KIND)[keyof typeof ACCOUNT_KIND];

export const ADMIN_ROLES = ["ADMIN_GOD", "ADMIN_COLLABORATOR"] as const;

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "ADMIN_GOD" || role === "ADMIN_COLLABORATOR";
}

export function isAccountKind(value: unknown): value is AccountKind {
  return value === ACCOUNT_KIND.INDIVIDUAL || value === ACCOUNT_KIND.COMPANY;
}
