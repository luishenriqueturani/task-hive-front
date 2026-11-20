import { readApiErrorMessage } from "@/lib/api-error";

export type AdminStats = {
  users: number;
  companies: number;
  openTickets: number;
};

export type AdminUserPlan = {
  id: string | null;
  slug: string;
  name: string;
  status: string;
};

export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  accountKind: string;
  createdAt: string;
  company: { id: string; legalName: string } | null;
  plan: AdminUserPlan;
};

export type AdminUsersPage = {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminUserDetail = AdminUserListItem & {
  document: string | null;
  usage: {
    projects: number;
    apiKeys: number;
    standaloneTasks: number;
    projectGuests: number | null;
  };
  limits: {
    maxProjects: number;
    maxApiKeys: number;
    maxStandaloneTasks: number;
    maxProjectGuests: number;
  };
  projects: { id: string; name: string; createdAt: string }[];
  subscription: {
    id: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    coupon: { id: string; code: string } | null;
    plan: AdminUserPlan;
  } | null;
};

export type AdminUsersQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  accountKind?: string;
  planSlug?: string;
  role?: string;
};

export type AdminCompanyListItem = {
  id: string;
  name: string;
  legalName: string;
  tradeName: string | null;
  document: string | null;
  createdAt: string;
  owner: { id: string; name: string | null; email: string } | null;
  plan: AdminUserPlan;
};

export type AdminCompaniesPage = {
  items: AdminCompanyListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminCompanyDetail = AdminCompanyListItem & {
  usage: { projects: number };
  limits: {
    maxProjects: number;
    maxApiKeys: number;
    maxStandaloneTasks: number;
    maxProjectGuests: number;
  };
  projects: { id: string; name: string; createdAt: string }[];
  subscription: AdminUserDetail["subscription"];
};

export type AdminCompaniesQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  document?: string;
  planSlug?: string;
};

export const ADMIN_STATS_QUERY_KEY = ["admin-stats"] as const;

export function adminUsersQueryKey(query: AdminUsersQuery) {
  return ["admin-users", query] as const;
}

export function adminUserQueryKey(id: string) {
  return ["admin-user", id] as const;
}

export function adminCompaniesQueryKey(query: AdminCompaniesQuery) {
  return ["admin-companies", query] as const;
}

export function adminCompanyQueryKey(id: string) {
  return ["admin-company", id] as const;
}

async function parseJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, fallback));
  }
  return (await res.json()) as T;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch("/api/bff/admin/stats", { credentials: "include" });
  return parseJson(res, "Não foi possível carregar o resumo.");
}

export async function fetchAdminUsers(
  query: AdminUsersQuery,
): Promise<AdminUsersPage> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.q) params.set("q", query.q);
  if (query.accountKind) params.set("accountKind", query.accountKind);
  if (query.planSlug) params.set("planSlug", query.planSlug);
  if (query.role) params.set("role", query.role);
  const qs = params.toString();
  const res = await fetch(`/api/bff/admin/users${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  return parseJson(res, "Não foi possível carregar os utilizadores.");
}

export async function fetchAdminUser(id: string): Promise<AdminUserDetail> {
  const res = await fetch(`/api/bff/admin/users/${id}`, {
    credentials: "include",
  });
  return parseJson(res, "Não foi possível carregar o utilizador.");
}

export async function fetchAdminCompanies(
  query: AdminCompaniesQuery,
): Promise<AdminCompaniesPage> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.q) params.set("q", query.q);
  if (query.document) params.set("document", query.document);
  if (query.planSlug) params.set("planSlug", query.planSlug);
  const qs = params.toString();
  const res = await fetch(`/api/bff/admin/companies${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  return parseJson(res, "Não foi possível carregar as empresas.");
}

export async function fetchAdminCompany(id: string): Promise<AdminCompanyDetail> {
  const res = await fetch(`/api/bff/admin/companies/${id}`, {
    credentials: "include",
  });
  return parseJson(res, "Não foi possível carregar a empresa.");
}

export async function assignAdminSubscription(dto: {
  userId?: string;
  companyId?: string;
  planId: string;
  couponCode?: string;
}): Promise<unknown> {
  const res = await fetch("/api/bff/admin/subscriptions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseJson(res, "Não foi possível atribuir o plano.");
}
