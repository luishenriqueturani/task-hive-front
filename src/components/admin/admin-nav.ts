export const ADMIN_NAV = [
  { href: "/admin", label: "Resumo", exact: true },
  { href: "/admin/users", label: "Utilizadores" },
  { href: "/admin/companies", label: "Empresas" },
  { href: "/admin/plans", label: "Planos" },
  { href: "/admin/coupons", label: "Cupons" },
  { href: "/admin/support", label: "Suporte" },
  { href: "/dashboard", label: "App" },
] as const;

export function isAdminNavActive(href: string, pathname: string, exact?: boolean) {
  if (exact || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
