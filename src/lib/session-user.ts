import {
  ACCOUNT_KIND,
  isAccountKind,
  isAdminRole,
  type AccountKind,
} from "@/lib/account-kind";

export interface SessionCompany {
  id: string;
  legalName: string;
  tradeName: string | null;
  document: string | null;
}

export interface SessionPlanLimits {
  maxProjects: number;
  maxApiKeys: number;
  maxStandaloneTasks: number;
  maxProjectGuests: number;
}

export interface SessionPlanUsage {
  projects: number;
  apiKeys: number;
  standaloneTasks: number;
  projectGuests: number | null;
}

export interface SessionPlan {
  slug: string;
  name: string;
  status: string;
  limits: SessionPlanLimits;
  usage: SessionPlanUsage;
}

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  accountKind: AccountKind;
  company: SessionCompany | null;
  plan: SessionPlan | null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseCompany(raw: unknown): SessionCompany | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (typeof data.id !== "string" || !data.id) return null;
  const legalName =
    typeof data.legalName === "string"
      ? data.legalName
      : typeof data.name === "string"
        ? data.name
        : "";
  if (!legalName) return null;
  return {
    id: data.id,
    legalName,
    tradeName: typeof data.tradeName === "string" ? data.tradeName : null,
    document: typeof data.document === "string" ? data.document : null,
  };
}

function parseLimits(raw: unknown): SessionPlanLimits | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const maxProjects = asFiniteNumber(data.maxProjects);
  const maxApiKeys = asFiniteNumber(data.maxApiKeys);
  const maxStandaloneTasks = asFiniteNumber(data.maxStandaloneTasks);
  const maxProjectGuests = asFiniteNumber(data.maxProjectGuests);
  if (
    maxProjects === null ||
    maxApiKeys === null ||
    maxStandaloneTasks === null ||
    maxProjectGuests === null
  ) {
    return null;
  }
  return { maxProjects, maxApiKeys, maxStandaloneTasks, maxProjectGuests };
}

function parseUsage(raw: unknown): SessionPlanUsage | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const projects = asFiniteNumber(data.projects);
  const apiKeys = asFiniteNumber(data.apiKeys);
  const standaloneTasks = asFiniteNumber(data.standaloneTasks);
  const projectGuests =
    data.projectGuests === null ? null : asFiniteNumber(data.projectGuests);
  if (
    projects === null ||
    apiKeys === null ||
    standaloneTasks === null ||
    projectGuests === undefined
  ) {
    return null;
  }
  return { projects, apiKeys, standaloneTasks, projectGuests };
}

function parsePlan(raw: unknown): SessionPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (typeof data.slug !== "string" || typeof data.name !== "string") {
    return null;
  }
  const limits = parseLimits(data.limits);
  const usage = parseUsage(data.usage);
  if (!limits || !usage) return null;
  return {
    slug: data.slug,
    name: data.name,
    status: typeof data.status === "string" ? data.status : "TRIAL",
    limits,
    usage,
  };
}

/**
 * Normaliza o payload de `/users/:id` (ou JWT) para a forma estável da sessão.
 * Campos SaaS ausentes recebem defaults; admins nunca levam `plan`.
 */
export function normalizeSessionUser(raw: {
  id: string;
  name?: string | null;
  email: string;
  role?: string | null;
  accountKind?: unknown;
  company?: unknown;
  ownedCompany?: unknown;
  plan?: unknown;
}): SessionUser {
  const role = raw.role ?? null;
  return {
    id: raw.id,
    name: raw.name ?? null,
    email: raw.email,
    role,
    accountKind: isAccountKind(raw.accountKind)
      ? raw.accountKind
      : ACCOUNT_KIND.INDIVIDUAL,
    company: parseCompany(raw.company) ?? parseCompany(raw.ownedCompany),
    plan: isAdminRole(role) ? null : parsePlan(raw.plan),
  };
}
