import { readApiErrorMessage } from "@/lib/api-error";
import {
  mapCatalogPlan,
  type LandingPlan,
} from "@/components/landing/plans-catalog";

export type PublicPlanBenefit = {
  id: string;
  title: string;
  body: string | null;
  icon: string | null;
  sortOrder: number;
};

export type PublicPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accountKind: string;
  interval: string;
  priceCents: number;
  currency: string;
  sortOrder: number;
  maxProjects: number;
  maxApiKeys: number;
  maxStandaloneTasks: number;
  maxProjectGuests: number;
  benefits: PublicPlanBenefit[];
};

export type AdminPlan = PublicPlan & {
  isActive: boolean;
  isSystem: boolean;
};

export const PUBLIC_PLANS_QUERY_KEY = ["public-plans"] as const;
export const ADMIN_PLANS_QUERY_KEY = ["admin-plans"] as const;

export async function fetchPublicPlans(): Promise<LandingPlan[]> {
  const res = await fetch("/api/bff/plans");
  if (!res.ok) {
    throw new Error("Não foi possível carregar os planos.");
  }
  const body = (await res.json()) as PublicPlan[];
  if (!Array.isArray(body)) {
    throw new Error("Resposta de planos inválida.");
  }
  return body.map(mapCatalogPlan);
}

export async function fetchAdminPlans(): Promise<AdminPlan[]> {
  const res = await fetch("/api/bff/admin/plans", { credentials: "include" });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível carregar os planos."),
    );
  }
  return (await res.json()) as AdminPlan[];
}

export async function updateAdminPlan(
  id: string,
  dto: Partial<
    Pick<
      AdminPlan,
      | "name"
      | "description"
      | "priceCents"
      | "isActive"
      | "sortOrder"
      | "maxProjects"
      | "maxApiKeys"
      | "maxStandaloneTasks"
      | "maxProjectGuests"
    >
  >,
): Promise<AdminPlan> {
  const res = await fetch(`/api/bff/admin/plans/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível guardar o plano."),
    );
  }
  return (await res.json()) as AdminPlan;
}

export async function deleteAdminPlan(id: string): Promise<void> {
  const res = await fetch(`/api/bff/admin/plans/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível apagar o plano."),
    );
  }
}

export async function createAdminPlanBenefit(
  planId: string,
  dto: { title: string; body?: string | null; sortOrder?: number },
): Promise<AdminPlan> {
  const res = await fetch(`/api/bff/admin/plans/${planId}/benefits`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível adicionar o benefício."),
    );
  }
  return (await res.json()) as AdminPlan;
}

export async function updateAdminPlanBenefit(
  planId: string,
  benefitId: string,
  dto: { title?: string; body?: string | null; sortOrder?: number },
): Promise<AdminPlan> {
  const res = await fetch(
    `/api/bff/admin/plans/${planId}/benefits/${benefitId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    },
  );
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível actualizar o benefício."),
    );
  }
  return (await res.json()) as AdminPlan;
}

export async function deleteAdminPlanBenefit(
  planId: string,
  benefitId: string,
): Promise<AdminPlan> {
  const res = await fetch(
    `/api/bff/admin/plans/${planId}/benefits/${benefitId}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível remover o benefício."),
    );
  }
  return (await res.json()) as AdminPlan;
}
