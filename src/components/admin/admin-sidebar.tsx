"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBuilding,
  FaGaugeHigh,
  FaHouse,
  FaLifeRing,
  FaTags,
  FaTicket,
  FaUsers,
} from "react-icons/fa6";
import {
  ADMIN_NAV,
  isAdminNavActive,
} from "@/components/admin/admin-nav";

const ICONS = {
  "/admin": FaGaugeHigh,
  "/admin/users": FaUsers,
  "/admin/companies": FaBuilding,
  "/admin/plans": FaTags,
  "/admin/coupons": FaTicket,
  "/admin/support": FaLifeRing,
  "/dashboard": FaHouse,
} as const;

/**
 * Navegação lateral do painel admin (desktop).
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-10 hidden w-60 shrink-0 flex-col border-r border-app-border/80 bg-app-surface/40 backdrop-blur-xl md:flex">
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Administração">
        {ADMIN_NAV.map((item) => {
          const Icon = ICONS[item.href];
          const active = isAdminNavActive(
            item.href,
            pathname,
            "exact" in item ? item.exact : false,
          );
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-app-surface-elevated text-app-text"
                  : "text-app-muted hover:bg-app-surface-elevated/90 hover:text-app-text"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
