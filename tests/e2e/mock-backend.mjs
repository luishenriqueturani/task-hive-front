#!/usr/bin/env node
/**
 * Backend mock em memória para smoke E2E do frontend.
 * Port padrão: 4099 (override com MOCK_BACKEND_PORT).
 *
 * Cobre: login, logout, users, projects (CRUD + participantes + convites) e
 * check-token/reset-password. Emite JWT fake compatível com decodeSessionUser.
 */
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_BACKEND_PORT || 4099);

/** @type {Map<string, { id: string, name: string, email: string, password: string, role: string }>} */
const usersByEmail = new Map();
/** @type {Map<string, { id: string, name: string, email: string, password: string, role: string }>} */
const usersById = new Map();
/** @type {Map<string, object>} */
const projects = new Map();
/** @type {Map<string, { id: string, name: string, order: number, projectId: string, deletedAt: string | null }>} */
const stages = new Map();
/** @type {Map<string, { id: string, name: string, description: string | null, finishDate: string | null, completedAt: string | null, order: number, stageId: string, userId: string, deletedAt: string | null }>} */
const tasks = new Map();
/** @type {Map<string, { id: string, name: string, description: string | null, isCompleted: boolean, taskId: string, responsibleId: string, deletedAt: string | null }>} */
const subtasks = new Map();
/** @type {Map<string, { id: string, taskId: string, userId: string, start: string, end: string | null }>} */
const timetracks = new Map();
/** @type {Map<string, { id: string, taskId: string, stageId: string, completedAt: string }>} */
const taskCompletions = new Map();
/** @type {Map<string, object>} */
const todos = new Map();
/** @type {Map<string, { id: string, projectId: string, email: string, token: string, status: string, expiresAt: string, createdAt: string }>} */
const invites = new Map();
let projectSeq = 1n;
let stageSeq = 1n;
let taskSeq = 1n;
let subtaskSeq = 1n;
let timetrackSeq = 1n;
let todoSeq = 1n;
let completionSeq = 1n;

function nextRecurringDate(type) {
  const d = new Date();
  if (type === "DAILY") d.setDate(d.getDate() + 1);
  else if (type === "WEEKLY") d.setDate(d.getDate() + 7);
  else if (type === "MONTHLY") d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

function todoView(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    type: t.type,
    recurringType: t.recurringType,
    recurringTimes: t.recurringTimes,
    recurringCount: t.recurringCount,
    recurringNextDate: t.recurringNextDate,
    recurringDeadline: t.recurringDeadline,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function timetrackView(entry) {
  const user = usersById.get(entry.userId);
  return {
    id: entry.id,
    start: entry.start,
    end: entry.end,
    userId: entry.userId,
    userName: user?.name || user?.email || "—",
  };
}

function projectForTask(task) {
  const stage = stages.get(task.stageId);
  if (!stage) return null;
  return projects.get(stage.projectId) ?? null;
}

function canAccessProject(project, user) {
  if (!project || project.deletedAt) return false;
  return (
    project.userOwner.id === user.id ||
    project.participants.some((p) => p.id === user.id) ||
    user.role === "ADMIN_GOD" ||
    user.role === "ADMIN_COLLABORATOR"
  );
}

function subtaskView(sub) {
  const responsible = usersById.get(sub.responsibleId);
  return {
    id: sub.id,
    name: sub.name,
    description: sub.description,
    isCompleted: sub.isCompleted,
    responsible: responsible
      ? {
          id: responsible.id,
          name: responsible.name,
          email: responsible.email,
        }
      : null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    deletedAt: sub.deletedAt,
  };
}

function taskView(task) {
  const stage = stages.get(task.stageId);
  const owner = usersById.get(task.userId);
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    finishDate: task.finishDate,
    completedAt: task.completedAt ?? null,
    order: task.order ?? 0,
    stage: stage
      ? { id: stage.id, name: stage.name, order: stage.order }
      : null,
    user: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    deletedAt: task.deletedAt,
  };
}

function reindexStageTasks(stageId) {
  const list = [...tasks.values()]
    .filter((t) => t.stageId === stageId && !t.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));
  list.forEach((t, i) => {
    t.order = i;
  });
}

function placeTaskInStage(task, targetStageId, index) {
  const sourceStageId = task.stageId;
  const siblings = [...tasks.values()]
    .filter(
      (t) =>
        t.stageId === targetStageId && !t.deletedAt && t.id !== task.id,
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));
  const insertAt =
    index === undefined || index === null
      ? siblings.length
      : Math.max(0, Math.min(Number(index), siblings.length));
  siblings.splice(insertAt, 0, task);
  task.stageId = targetStageId;
  siblings.forEach((t, i) => {
    t.order = i;
  });
  if (sourceStageId !== targetStageId) {
    reindexStageTasks(sourceStageId);
  }
}

function registerUser(user) {
  if (!user.createdAt) user.createdAt = new Date().toISOString();
  usersByEmail.set(user.email, user);
  usersById.set(user.id, user);
}

const seed = {
  id: randomUUID(),
  name: "Usuário E2E",
  email: "e2e@taskhive.test",
  password: "SenhaForte123!",
  role: "CLIENT",
  accountKind: "INDIVIDUAL",
  document: null,
  company: null,
};
registerUser(seed);

const seedColleague = {
  id: randomUUID(),
  name: "Colega E2E",
  email: "colega@taskhive.test",
  password: "SenhaForte123!",
  role: "CLIENT",
  accountKind: "INDIVIDUAL",
  document: null,
  company: null,
};
registerUser(seedColleague);

const seedAdmin = {
  id: randomUUID(),
  name: "Admin E2E",
  email: "admin@taskhive.test",
  password: "SenhaForte123!",
  role: "ADMIN_GOD",
  accountKind: "INDIVIDUAL",
  document: null,
  company: null,
};
registerUser(seedAdmin);

const seedCompanyOwner = {
  id: randomUUID(),
  name: "Empresa E2E",
  email: "empresa@taskhive.test",
  password: "SenhaForte123!",
  role: "CLIENT",
  accountKind: "COMPANY",
  document: "11444777000161",
  company: {
    id: randomUUID(),
    legalName: "Empresa E2E Ltda",
    tradeName: "Empresa E2E",
    document: "11444777000161",
  },
};
registerUser(seedCompanyOwner);

/** @type {Map<string, object>} */
const catalogPlans = new Map();
/** @type {Map<string, object>} */
const subscriptions = new Map();
/** @type {Map<string, object>} */
const catalogCoupons = new Map();

function seedPlan(plan) {
  catalogPlans.set(plan.id, plan);
}

function addBenefit(plan, title, body, sortOrder) {
  plan.benefits.push({
    id: randomUUID(),
    title,
    body,
    icon: null,
    sortOrder,
  });
}

seedPlan({
  id: "plan-trial",
  slug: "free-trial",
  name: "Free Trial",
  description: "Trial técnico — não aparece na landing.",
  accountKind: "BOTH",
  interval: "MONTHLY",
  priceCents: 0,
  currency: "BRL",
  isActive: true,
  isSystem: true,
  sortOrder: 0,
  maxProjects: 3,
  maxApiKeys: 1,
  maxStandaloneTasks: 15,
  maxProjectGuests: 2,
  deletedAt: null,
  benefits: [],
});
seedPlan({
  id: "plan-starter",
  slug: "starter",
  name: "Starter",
  description: "Para começar com Kanban, to-do e chaves de API.",
  accountKind: "BOTH",
  interval: "MONTHLY",
  priceCents: 2900,
  currency: "BRL",
  isActive: true,
  isSystem: false,
  sortOrder: 1,
  maxProjects: 5,
  maxApiKeys: 2,
  maxStandaloneTasks: 30,
  maxProjectGuests: 3,
  deletedAt: null,
  benefits: [],
});
seedPlan({
  id: "plan-pro",
  slug: "pro",
  name: "Pro",
  description: "Mais projectos, convidados e chaves de API.",
  accountKind: "BOTH",
  interval: "MONTHLY",
  priceCents: 7900,
  currency: "BRL",
  isActive: true,
  isSystem: false,
  sortOrder: 2,
  maxProjects: 20,
  maxApiKeys: 10,
  maxStandaloneTasks: 200,
  maxProjectGuests: 15,
  deletedAt: null,
  benefits: [],
});
seedPlan({
  id: "plan-business",
  slug: "business",
  name: "Business",
  description: "Quotas ilimitadas e suporte prioritário.",
  accountKind: "BOTH",
  interval: "MONTHLY",
  priceCents: 19900,
  currency: "BRL",
  isActive: true,
  isSystem: false,
  sortOrder: 3,
  maxProjects: -1,
  maxApiKeys: -1,
  maxStandaloneTasks: -1,
  maxProjectGuests: -1,
  deletedAt: null,
  benefits: [],
});
addBenefit(catalogPlans.get("plan-starter"), "Quadros Kanban", null, 0);
addBenefit(catalogPlans.get("plan-pro"), "Tudo do Starter", null, 0);
addBenefit(catalogPlans.get("plan-business"), "Quotas ilimitadas", null, 0);

catalogCoupons.set("WELCOME10", {
  id: "coupon-welcome",
  code: "WELCOME10",
  isActive: true,
  maxRedemptions: 50,
  redeemedCount: 0,
  applicablePlanIds: ["plan-starter", "plan-pro", "plan-business"],
});

function livePlans() {
  return [...catalogPlans.values()]
    .filter((plan) => !plan.deletedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function publicPlanView(plan) {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    accountKind: plan.accountKind,
    interval: plan.interval,
    priceCents: plan.priceCents,
    currency: plan.currency,
    sortOrder: plan.sortOrder,
    maxProjects: plan.maxProjects,
    maxApiKeys: plan.maxApiKeys,
    maxStandaloneTasks: plan.maxStandaloneTasks,
    maxProjectGuests: plan.maxProjectGuests,
    benefits: [...plan.benefits].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

function adminPlanView(plan) {
  return {
    ...publicPlanView(plan),
    isActive: plan.isActive,
    isSystem: plan.isSystem,
  };
}

function isAdminRole(user) {
  return user.role === "ADMIN_GOD" || user.role === "ADMIN_COLLABORATOR";
}

function liveSubscriptionFor(user) {
  const live = [...subscriptions.values()].filter(
    (sub) => sub.status === "TRIAL" || sub.status === "ACTIVE",
  );
  if (user.company?.id) {
    const byCompany = live.find((sub) => sub.companyId === user.company.id);
    if (byCompany) return byCompany;
  }
  return live.find((sub) => sub.userId === user.id) ?? null;
}

function trialPlanView() {
  const trial = catalogPlans.get("plan-trial");
  return {
    id: trial?.id ?? null,
    slug: "free-trial",
    name: trial?.name ?? "Free Trial",
    status: "TRIAL",
  };
}

function adminUserPlan(user) {
  const sub = liveSubscriptionFor(user);
  if (!sub) return trialPlanView();
  const plan = catalogPlans.get(sub.planId);
  return {
    id: plan?.id ?? sub.planId,
    slug: plan?.slug ?? "unknown",
    name: plan?.name ?? "Plano",
    status: sub.status,
  };
}

function adminUserListItem(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountKind: user.accountKind || "INDIVIDUAL",
    createdAt: user.createdAt,
    company: user.company
      ? { id: user.company.id, legalName: user.company.legalName }
      : null,
    plan: adminUserPlan(user),
  };
}

function userProjects(user) {
  return [...projects.values()].filter(
    (project) =>
      !project.deletedAt &&
      (project.userOwner.id === user.id ||
        (user.company?.id && project.companyOwnerId === user.company.id)),
  );
}

function allCompanies() {
  const map = new Map();
  for (const user of usersById.values()) {
    if (user.company?.id && !map.has(user.company.id)) {
      map.set(user.company.id, {
        id: user.company.id,
        name: user.company.legalName || user.name,
        legalName: user.company.legalName,
        tradeName: user.company.tradeName ?? null,
        document: user.company.document ?? null,
        createdAt: user.createdAt,
        owner: user,
      });
    }
  }
  return [...map.values()];
}

function liveSubscriptionForCompany(companyId) {
  return (
    [...subscriptions.values()].find(
      (sub) =>
        sub.companyId === companyId &&
        (sub.status === "TRIAL" || sub.status === "ACTIVE"),
    ) ?? null
  );
}

function adminCompanyPlan(company) {
  const sub = liveSubscriptionForCompany(company.id);
  if (!sub) return trialPlanView();
  const plan = catalogPlans.get(sub.planId);
  return {
    id: plan?.id ?? sub.planId,
    slug: plan?.slug ?? "unknown",
    name: plan?.name ?? "Plano",
    status: sub.status,
  };
}

function adminCompanyListItem(company) {
  return {
    id: company.id,
    name: company.name,
    legalName: company.legalName,
    tradeName: company.tradeName,
    document: company.document,
    createdAt: company.createdAt,
    owner: company.owner
      ? {
          id: company.owner.id,
          name: company.owner.name,
          email: company.owner.email,
        }
      : null,
    plan: adminCompanyPlan(company),
  };
}

function userTodos(user) {
  return [...todos.values()].filter(
    (todo) => todo.userId === user.id && !todo.deletedAt,
  );
}

function requireAdmin(req, res) {
  const user = bearerUser(req);
  if (!user) {
    send(res, 401, { message: "Unauthorized" });
    return null;
  }
  if (!isAdminRole(user)) {
    send(res, 403, { message: "Acesso negado: permissão insuficiente" });
    return null;
  }
  return user;
}

function participantView(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: null,
    role: user.role,
  };
}

function canManage(project, user) {
  return (
    project.userOwner.id === user.id ||
    user.role === "ADMIN_GOD" ||
    user.role === "ADMIN_COLLABORATOR"
  );
}

const TRIAL_MAX_PROJECT_GUESTS = 2;

function pendingInvitesFor(projectId) {
  return [...invites.values()].filter(
    (inv) => inv.projectId === projectId && inv.status === "PENDING",
  );
}

function guestUsageFor(project) {
  const pending = pendingInvitesFor(project.id).length;
  return {
    used: project.participants.length + pending,
    limit: TRIAL_MAX_PROJECT_GUESTS,
    pendingInvites: pending,
  };
}

function guestLimitReached(project) {
  const usage = guestUsageFor(project);
  return usage.limit >= 0 && usage.used >= usage.limit;
}

function inviteView(inv) {
  return {
    id: inv.id,
    email: inv.email,
    token: inv.token,
    status: inv.status,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  };
}

function sendPlanLimitGuests(res, project) {
  const usage = guestUsageFor(project);
  return send(res, 402, {
    code: "PLAN_LIMIT_GUESTS",
    message: "Limite de convidados do plano atingido.",
    limit: usage.limit,
    used: usage.used,
  });
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function makeJwt(user) {
  const header = b64url({ alg: "none", typ: "JWT" });
  const payload = b64url({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountKind: user.accountKind || "INDIVIDUAL",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });
  return `${header}.${payload}.mocksig`;
}

function sessionPayload(user) {
  return {
    token: makeJwt(user),
    refreshToken: randomUUID(),
    user: publicUser(user),
  };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: null,
    accountKind: user.accountKind || "INDIVIDUAL",
    document: user.document ?? null,
    company: user.company ?? null,
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  });
  res.end(payload);
}

function bearerUser(req) {
  const auth = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return null;
  try {
    const parts = m[1].split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    return usersByEmail.get(payload.email) ?? null;
  } catch {
    return null;
  }
}

function projectForClient(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deletedAt: p.deletedAt,
    userOwner: p.userOwner,
    participants: p.participants,
  };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      return send(res, 204);
    }

    const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
    const path = url.pathname;

    if (req.method === "GET" && path === "/health") {
      return send(res, 200, { ok: true });
    }

    const acceptInviteMatch = /^\/invites\/([^/]+)\/accept$/.exec(path);
    if (req.method === "POST" && acceptInviteMatch) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const token = decodeURIComponent(acceptInviteMatch[1]);
      const invite = [...invites.values()].find((i) => i.token === token);
      if (
        !invite ||
        invite.status !== "PENDING" ||
        Date.parse(invite.expiresAt) <= Date.now()
      ) {
        return send(res, 404, { message: "Convite inválido ou expirado." });
      }
      if (String(user.email || "").toLowerCase() !== invite.email) {
        return send(res, 403, {
          message: "Este convite é para outro e-mail.",
        });
      }
      const project = projects.get(invite.projectId);
      if (!project || project.deletedAt) {
        return send(res, 404, { message: "Projeto não encontrado" });
      }
      if (
        project.userOwner.id !== user.id &&
        !project.participants.some((p) => p.id === user.id)
      ) {
        project.participants.push(publicUser(user));
      }
      invite.status = "ACCEPTED";
      return send(res, 200, {
        projectId: project.id,
        projectName: project.name,
      });
    }

    const inviteMatch = /^\/invites\/([^/]+)$/.exec(path);
    if (req.method === "GET" && inviteMatch) {
      const token = decodeURIComponent(inviteMatch[1]);
      if (token === "e2e-invite-token") {
        return send(res, 200, {
          email: "convidado@taskhive.test",
          projectName: "Projeto Convite",
        });
      }
      const invite = [...invites.values()].find((i) => i.token === token);
      if (
        invite &&
        invite.status === "PENDING" &&
        Date.parse(invite.expiresAt) > Date.now()
      ) {
        const project = projects.get(invite.projectId);
        return send(res, 200, {
          email: invite.email,
          projectName: project?.name,
        });
      }
      return send(res, 404, { message: "Convite inválido ou expirado." });
    }

    if (req.method === "GET" && path === "/plans") {
      return send(
        res,
        200,
        livePlans()
          .filter((plan) => plan.isActive && !plan.isSystem)
          .map(publicPlanView),
      );
    }

    const adminBenefitMatch =
      /^\/admin\/plans\/([^/]+)\/benefits(?:\/([^/]+))?$/.exec(path);
    if (adminBenefitMatch) {
      if (!requireAdmin(req, res)) return;
      const plan = catalogPlans.get(adminBenefitMatch[1]);
      if (!plan || plan.deletedAt) {
        return send(res, 404, { message: "Plano não encontrado." });
      }
      const benefitId = adminBenefitMatch[2];

      if (req.method === "POST" && !benefitId) {
        const body = await readBody(req);
        if (!body?.title?.trim()) {
          return send(res, 422, { message: "should not be empty" });
        }
        addBenefit(
          plan,
          body.title.trim(),
          body.body ?? null,
          body.sortOrder ?? plan.benefits.length,
        );
        return send(res, 201, adminPlanView(plan));
      }

      const benefit = plan.benefits.find((item) => item.id === benefitId);
      if (!benefit) {
        return send(res, 404, { message: "Benefício não encontrado." });
      }

      if (req.method === "PATCH") {
        const body = await readBody(req);
        if (body?.title !== undefined) benefit.title = body.title;
        if (body?.body !== undefined) benefit.body = body.body ?? null;
        if (body?.sortOrder !== undefined) benefit.sortOrder = body.sortOrder;
        return send(res, 200, adminPlanView(plan));
      }

      if (req.method === "DELETE") {
        plan.benefits = plan.benefits.filter((item) => item.id !== benefitId);
        return send(res, 200, adminPlanView(plan));
      }
    }

    if (req.method === "GET" && path === "/admin/stats") {
      if (!requireAdmin(req, res)) return;
      const companies = [...usersById.values()].filter(
        (item) => item.accountKind === "COMPANY" || item.company,
      ).length;
      return send(res, 200, {
        users: usersById.size,
        companies,
        openTickets: 0,
      });
    }

    if (req.method === "GET" && path === "/admin/users") {
      if (!requireAdmin(req, res)) return;
      const q = String(url.searchParams.get("q") ?? "")
        .trim()
        .toLowerCase();
      const accountKind = url.searchParams.get("accountKind") || "";
      const planSlug = url.searchParams.get("planSlug") || "";
      const role = url.searchParams.get("role") || "";
      const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
      const pageSize = Math.min(
        50,
        Math.max(1, Number(url.searchParams.get("pageSize") || 20) || 20),
      );
      let rows = [...usersById.values()];
      if (q) {
        rows = rows.filter(
          (item) =>
            String(item.name || "")
              .toLowerCase()
              .includes(q) || item.email.toLowerCase().includes(q),
        );
      }
      if (accountKind) {
        rows = rows.filter((item) => item.accountKind === accountKind);
      }
      if (role) {
        rows = rows.filter((item) => item.role === role);
      }
      if (planSlug) {
        rows = rows.filter((item) => adminUserPlan(item).slug === planSlug);
      }
      rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const total = rows.length;
      const items = rows
        .slice((page - 1) * pageSize, page * pageSize)
        .map(adminUserListItem);
      return send(res, 200, { items, total, page, pageSize });
    }

    const adminUserMatch = /^\/admin\/users\/([^/]+)$/.exec(path);
    if (req.method === "GET" && adminUserMatch) {
      if (!requireAdmin(req, res)) return;
      const found = usersById.get(adminUserMatch[1]);
      if (!found) {
        return send(res, 404, { message: "Utilizador não encontrado." });
      }
      const plan = adminUserPlan(found);
      const catalog = catalogPlans.get(plan.id) ?? catalogPlans.get("plan-trial");
      const owned = userProjects(found);
      const sub = liveSubscriptionFor(found);
      return send(res, 200, {
        ...adminUserListItem(found),
        document: found.document ?? null,
        usage: {
          projects: owned.length,
          apiKeys: 0,
          standaloneTasks: userTodos(found).length,
          projectGuests: null,
        },
        limits: {
          maxProjects: catalog?.maxProjects ?? 3,
          maxApiKeys: catalog?.maxApiKeys ?? 1,
          maxStandaloneTasks: catalog?.maxStandaloneTasks ?? 15,
          maxProjectGuests: catalog?.maxProjectGuests ?? 2,
        },
        projects: owned.map((project) => ({
          id: project.id,
          name: project.name,
          createdAt: project.createdAt,
        })),
        subscription: sub
          ? {
              id: sub.id,
              status: sub.status,
              startsAt: sub.startsAt,
              endsAt: sub.endsAt,
              coupon: sub.couponCode
                ? { id: sub.couponCode, code: sub.couponCode }
                : null,
              plan,
            }
          : null,
      });
    }

    if (req.method === "GET" && path === "/admin/companies") {
      if (!requireAdmin(req, res)) return;
      const q = String(url.searchParams.get("q") ?? "")
        .trim()
        .toLowerCase();
      const documentDigits = String(url.searchParams.get("document") ?? "").replace(
        /\D/g,
        "",
      );
      const planSlug = url.searchParams.get("planSlug") || "";
      const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
      const pageSize = Math.min(
        50,
        Math.max(1, Number(url.searchParams.get("pageSize") || 20) || 20),
      );
      let rows = allCompanies();
      if (q) {
        rows = rows.filter(
          (item) =>
            String(item.name || "")
              .toLowerCase()
              .includes(q) ||
            String(item.legalName || "")
              .toLowerCase()
              .includes(q) ||
            String(item.tradeName || "")
              .toLowerCase()
              .includes(q),
        );
      }
      if (documentDigits) {
        rows = rows.filter((item) =>
          String(item.document || "").replace(/\D/g, "").includes(documentDigits),
        );
      }
      if (planSlug) {
        rows = rows.filter((item) => adminCompanyPlan(item).slug === planSlug);
      }
      rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const total = rows.length;
      const items = rows
        .slice((page - 1) * pageSize, page * pageSize)
        .map(adminCompanyListItem);
      return send(res, 200, { items, total, page, pageSize });
    }

    const adminCompanyMatch = /^\/admin\/companies\/([^/]+)$/.exec(path);
    if (req.method === "GET" && adminCompanyMatch) {
      if (!requireAdmin(req, res)) return;
      const found = allCompanies().find(
        (item) => item.id === adminCompanyMatch[1],
      );
      if (!found) {
        return send(res, 404, { message: "Empresa não encontrada." });
      }
      const plan = adminCompanyPlan(found);
      const catalog = catalogPlans.get(plan.id) ?? catalogPlans.get("plan-trial");
      const owned = [...projects.values()].filter(
        (project) =>
          !project.deletedAt && project.companyOwnerId === found.id,
      );
      const sub = liveSubscriptionForCompany(found.id);
      return send(res, 200, {
        ...adminCompanyListItem(found),
        usage: { projects: owned.length },
        limits: {
          maxProjects: catalog?.maxProjects ?? 3,
          maxApiKeys: catalog?.maxApiKeys ?? 1,
          maxStandaloneTasks: catalog?.maxStandaloneTasks ?? 15,
          maxProjectGuests: catalog?.maxProjectGuests ?? 2,
        },
        projects: owned.map((project) => ({
          id: project.id,
          name: project.name,
          createdAt: project.createdAt,
        })),
        subscription: sub
          ? {
              id: sub.id,
              status: sub.status,
              startsAt: sub.startsAt,
              endsAt: sub.endsAt,
              coupon: sub.couponCode
                ? { id: sub.couponCode, code: sub.couponCode }
                : null,
              plan,
            }
          : null,
      });
    }

    if (req.method === "POST" && path === "/admin/subscriptions") {
      const actor = requireAdmin(req, res);
      if (!actor) return;
      const body = await readBody(req);
      if (Boolean(body?.userId) === Boolean(body?.companyId)) {
        return send(res, 400, {
          message: "Indique userId ou companyId, não ambos.",
        });
      }
      const plan = catalogPlans.get(body.planId);
      if (!plan || plan.deletedAt) {
        return send(res, 404, { message: "Plano não encontrado." });
      }
      let coupon = null;
      if (body.couponCode) {
        coupon = catalogCoupons.get(String(body.couponCode).toUpperCase());
        if (!coupon || !coupon.isActive) {
          return send(res, 404, { message: "Cupom não encontrado." });
        }
        if (plan.isSystem) {
          return send(res, 400, {
            message: "Cupons não se aplicam ao plano de sistema (trial).",
          });
        }
      }
      const targetUser = body.userId ? usersById.get(body.userId) : null;
      if (body.userId && !targetUser) {
        return send(res, 404, { message: "Utilizador não encontrado." });
      }
      const companyId =
        body.companyId ||
        (targetUser?.accountKind === "COMPANY" ? targetUser.company?.id : null);
      const userId = companyId ? null : targetUser?.id;
      for (const sub of subscriptions.values()) {
        const match = companyId
          ? sub.companyId === companyId
          : sub.userId === userId;
        if (match && (sub.status === "TRIAL" || sub.status === "ACTIVE")) {
          sub.status = "CANCELED";
        }
      }
      const created = {
        id: randomUUID(),
        status: plan.isSystem ? "TRIAL" : "ACTIVE",
        planId: plan.id,
        userId,
        companyId: companyId ?? null,
        couponCode: coupon?.code ?? null,
        startsAt: new Date().toISOString(),
        endsAt: null,
      };
      subscriptions.set(created.id, created);
      if (coupon) coupon.redeemedCount += 1;
      return send(res, 200, {
        id: created.id,
        status: created.status,
        plan: { id: plan.id, slug: plan.slug, name: plan.name },
        coupon: coupon ? { id: coupon.id, code: coupon.code } : null,
      });
    }

    if (path === "/admin/plans") {
      if (!requireAdmin(req, res)) return;
      if (req.method === "GET") {
        return send(res, 200, livePlans().map(adminPlanView));
      }
    }

    const adminPlanMatch = /^\/admin\/plans\/([^/]+)$/.exec(path);
    if (adminPlanMatch) {
      if (!requireAdmin(req, res)) return;
      const plan = catalogPlans.get(adminPlanMatch[1]);
      if (!plan || plan.deletedAt) {
        return send(res, 404, { message: "Plano não encontrado." });
      }

      if (req.method === "GET") {
        return send(res, 200, adminPlanView(plan));
      }

      if (req.method === "PATCH") {
        const body = await readBody(req);
        const assignable = [
          "name",
          "description",
          "priceCents",
          "isActive",
          "sortOrder",
          "maxProjects",
          "maxApiKeys",
          "maxStandaloneTasks",
          "maxProjectGuests",
        ];
        for (const key of assignable) {
          if (body?.[key] !== undefined) plan[key] = body[key];
        }
        return send(res, 200, adminPlanView(plan));
      }

      if (req.method === "DELETE") {
        if (plan.isSystem) {
          return send(res, 403, {
            message: "Não é possível apagar um plano de sistema.",
          });
        }
        plan.deletedAt = new Date().toISOString();
        return send(res, 200, { id: plan.id });
      }
    }

    if (req.method === "POST" && path === "/auth/login") {
      const body = await readBody(req);
      const user = usersByEmail.get(String(body?.email || "").toLowerCase());
      if (!user || user.password !== body?.password) {
        return send(res, 401, { message: "E-mail ou senha inválidos." });
      }
      return send(res, 200, sessionPayload(user));
    }

    if (req.method === "POST" && path === "/auth/logout") {
      return send(res, 204);
    }

    if (req.method === "POST" && path === "/auth/check-token") {
      const body = await readBody(req);
      return send(res, 200, body?.token === "valid-reset-token");
    }

    if (req.method === "POST" && path === "/auth/forget-password") {
      return send(res, 200, true);
    }

    if (req.method === "POST" && path === "/auth/reset-password") {
      const body = await readBody(req);
      if (body?.token !== "valid-reset-token") {
        return send(res, 400, { message: "Token inválido" });
      }
      const user = seed;
      user.password = body.password;
      return send(res, 200, sessionPayload(user));
    }

    if (req.method === "POST" && path === "/users") {
      const body = await readBody(req);
      const email = String(body?.email || "").toLowerCase();
      if (!email || !body?.password) {
        return send(res, 422, { message: "should not be empty" });
      }
      if (body.password !== body.confirmPassword) {
        return send(res, 422, {
          message: "confirmPassword must match password",
        });
      }
      if (usersByEmail.has(email)) {
        return send(res, 409, { message: "E-mail já cadastrado" });
      }
      const user = {
        id: randomUUID(),
        name: body.name || email,
        email,
        password: body.password,
        role: "CLIENT",
        accountKind: body.accountKind === "COMPANY" ? "COMPANY" : "INDIVIDUAL",
        document: body.document || null,
        company:
          body.accountKind === "COMPANY" && body.company
            ? {
                id: randomUUID(),
                legalName: body.company.legalName,
                tradeName: body.company.tradeName || null,
                document: body.company.document || null,
              }
            : null,
      };
      registerUser(user);
      return send(res, 201, publicUser(user));
    }

    if (req.method === "GET" && path === "/users/search") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const q = String(url.searchParams.get("q") ?? "").toLowerCase();
      const list = [...usersById.values()]
        .filter(
          (u) =>
            !q ||
            u.email.toLowerCase().includes(q) ||
            u.name.toLowerCase().includes(q),
        )
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: null,
          role: u.role,
        }));
      return send(res, 200, list);
    }

    const userByIdMatch = /^\/users\/([^/]+)$/.exec(path);
    if (req.method === "GET" && userByIdMatch) {
      const actor = bearerUser(req);
      if (!actor) return send(res, 401, { message: "Unauthorized" });
      const found = usersById.get(userByIdMatch[1]);
      if (!found) return send(res, 404, { message: "Usuário não encontrado" });
      if (actor.id !== found.id && actor.role === "CLIENT") {
        return send(res, 404, { message: "Usuário não encontrado" });
      }
      return send(res, 200, publicUser(found));
    }

    if (req.method === "GET" && path === "/users") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      return send(
        res,
        200,
        [...usersById.values()].map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          deletedAt: null,
        })),
      );
    }

    if (path === "/to-do" && req.method === "GET") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const list = [...todos.values()]
        .filter((t) => t.userId === user.id && !t.deletedAt)
        .map(todoView);
      return send(res, 200, list);
    }

    if (path === "/to-do" && req.method === "POST") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const body = await readBody(req);
      if (!body?.title?.trim() || body.title.trim().length < 3) {
        return send(res, 422, { message: "title minLength" });
      }
      if (!body?.description?.trim() || body.description.trim().length < 3) {
        return send(res, 422, { message: "description minLength" });
      }
      const id = String(todoSeq++);
      const recurring = body.isRecurring === true;
      const todo = {
        id,
        title: body.title.trim(),
        description: body.description.trim(),
        status: "CREATED",
        type: recurring ? "RECURRING" : "PUNCTUAL",
        recurringType: recurring ? body.recurringType || "WEEKLY" : null,
        recurringTimes: recurring ? (body.recurringTimes ?? null) : null,
        recurringCount: 0,
        recurringNextDate: recurring
          ? nextRecurringDate(body.recurringType || "WEEKLY")
          : null,
        recurringDeadline: recurring ? (body.recurringDeadline ?? null) : null,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
      };
      todos.set(id, todo);
      return send(res, 201, todoView(todo));
    }

    const todoEnd = /^\/to-do\/end\/([^/]+)$/.exec(path);
    if (todoEnd && req.method === "PATCH") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const todo = todos.get(todoEnd[1]);
      if (!todo || todo.deletedAt) {
        return send(res, 400, { message: "Tarefa não encontrada" });
      }
      todo.status = "DONE";
      todo.updatedAt = new Date().toISOString();
      return send(res, 200, { affected: 1 });
    }

    const todoStatus = /^\/to-do\/status\/([^/]+)$/.exec(path);
    if (todoStatus && req.method === "PATCH") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const todo = todos.get(todoStatus[1]);
      if (!todo || todo.deletedAt) {
        return send(res, 400, { message: "Tarefa não encontrada" });
      }
      const body = await readBody(req);
      todo.status = body?.status || todo.status;
      todo.updatedAt = new Date().toISOString();
      return send(res, 200, { affected: 1 });
    }

    const todoNext = /^\/to-do\/nextDateRecurring\/([^/]+)$/.exec(path);
    if (todoNext && req.method === "PATCH") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const todo = todos.get(todoNext[1]);
      if (!todo || todo.deletedAt) {
        return send(res, 400, { message: "Tarefa não encontrada" });
      }
      if (todo.type !== "RECURRING") {
        todo.status = "DONE";
        todo.updatedAt = new Date().toISOString();
        return send(res, 200, { affected: 1 });
      }
      const count = (todo.recurringCount || 0) + 1;
      if (todo.recurringTimes != null && count >= todo.recurringTimes) {
        todo.status = "DONE";
      } else {
        const base = todo.recurringNextDate
          ? new Date(todo.recurringNextDate)
          : new Date();
        const next = new Date(base);
        if (todo.recurringType === "DAILY") next.setDate(next.getDate() + 1);
        else if (todo.recurringType === "MONTHLY")
          next.setMonth(next.getMonth() + 1);
        else next.setDate(next.getDate() + 7);
        if (
          todo.recurringDeadline &&
          next.getTime() > new Date(todo.recurringDeadline).getTime()
        ) {
          todo.status = "DONE";
        } else {
          todo.recurringCount = count;
          todo.recurringNextDate = next.toISOString();
          todo.status = "TODO";
        }
      }
      todo.updatedAt = new Date().toISOString();
      return send(res, 200, { affected: 1 });
    }

    const todoOne = /^\/to-do\/([^/]+)$/.exec(path);
    if (todoOne) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const todo = todos.get(todoOne[1]);
      if (!todo || todo.deletedAt) {
        return send(res, 400, { message: "Tarefa não encontrada" });
      }

      if (req.method === "GET") {
        return send(res, 200, todoView(todo));
      }

      if (req.method === "PUT") {
        const body = await readBody(req);
        if (body?.title !== undefined) todo.title = body.title;
        if (body?.description !== undefined) todo.description = body.description;
        if (body?.isRecurring !== undefined) {
          todo.type = body.isRecurring ? "RECURRING" : "PUNCTUAL";
        }
        if (body?.recurringType !== undefined) {
          todo.recurringType = body.recurringType;
        }
        todo.updatedAt = new Date().toISOString();
        return send(res, 200, { affected: 1 });
      }

      if (req.method === "PATCH") {
        // soft delete
        todo.deletedAt = new Date().toISOString();
        return send(res, 200, { affected: 1 });
      }
    }

    if (path === "/projects" && req.method === "GET") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const scope = url.searchParams.get("scope") || "all";
      const list = [...projects.values()]
        .filter((p) => !p.deletedAt)
        .filter((p) => {
          const owned = p.userOwner.id === user.id;
          const invited = p.participants.some((part) => part.id === user.id);
          if (scope === "owned") return owned;
          if (scope === "invited") return invited && !owned;
          return owned || invited;
        })
        .map(projectForClient);
      return send(res, 200, list);
    }

    if (path === "/projects" && req.method === "POST") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const body = await readBody(req);
      if (!body?.name?.trim()) {
        return send(res, 422, { message: "should not be empty" });
      }
      const id = String(projectSeq++);
      const now = new Date().toISOString();
      const project = {
        id,
        name: body.name.trim(),
        description: body.description ?? null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        userOwner: publicUser(user),
        companyOwnerId: user.company?.id ?? null,
        participants: [],
      };
      projects.set(id, project);
      return send(res, 201, projectForClient(project));
    }

    const participantsMatch = /^\/projects\/([^/]+)\/participants(?:\/([^/]+))?$/.exec(
      path,
    );
    if (participantsMatch) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const project = projects.get(participantsMatch[1]);
      if (!project || project.deletedAt) {
        return send(res, 404, { message: "Projeto não encontrado" });
      }
      const participantUserId = participantsMatch[2];

      if (req.method === "GET" && !participantUserId) {
        return send(
          res,
          200,
          project.participants.map((p) => participantView(p)),
        );
      }

      if (req.method === "POST" && !participantUserId) {
        if (!canManage(project, user)) {
          return send(res, 403, { message: "Forbidden resource" });
        }
        const body = await readBody(req);
        const toAdd = usersById.get(body?.userId);
        if (!toAdd) {
          return send(res, 404, { message: "Usuário não encontrado" });
        }
        if (project.userOwner.id === toAdd.id) {
          return send(res, 400, {
            message: "O dono do projeto já tem acesso total",
          });
        }
        if (project.participants.some((p) => p.id === toAdd.id)) {
          return send(res, 400, {
            message: "Usuário já é participante do projeto",
          });
        }
        const email = String(toAdd.email || "").toLowerCase();
        const pending = pendingInvitesFor(project.id).find(
          (i) => i.email === email,
        );
        if (!pending && guestLimitReached(project)) {
          return sendPlanLimitGuests(res, project);
        }
        project.participants.push(publicUser(toAdd));
        if (pending) pending.status = "ACCEPTED";
        return send(
          res,
          200,
          project.participants.map((p) => participantView(p)),
        );
      }

      if (req.method === "DELETE" && participantUserId) {
        if (!canManage(project, user)) {
          return send(res, 403, { message: "Forbidden resource" });
        }
        project.participants = project.participants.filter(
          (p) => p.id !== participantUserId,
        );
        return send(
          res,
          200,
          project.participants.map((p) => participantView(p)),
        );
      }
    }

    const projectInvitesMatch =
      /^\/projects\/([^/]+)\/invites(?:\/([^/]+))?$/.exec(path);
    if (projectInvitesMatch) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const project = projects.get(projectInvitesMatch[1]);
      if (!project || project.deletedAt) {
        return send(res, 404, { message: "Projeto não encontrado" });
      }
      if (!canManage(project, user)) {
        return send(res, 403, { message: "Forbidden resource" });
      }
      const inviteId = projectInvitesMatch[2];

      if (req.method === "GET" && !inviteId) {
        const pending = pendingInvitesFor(project.id);
        return send(res, 200, {
          invites: pending.map(inviteView),
          guestUsage: guestUsageFor(project),
        });
      }

      if (req.method === "POST" && !inviteId) {
        const body = await readBody(req);
        const email = String(body?.email || "").trim().toLowerCase();
        if (!email.includes("@")) {
          return send(res, 422, { message: "e-mail inválido" });
        }
        if (String(project.userOwner.email || "").toLowerCase() === email) {
          return send(res, 400, {
            message: "O dono do projeto já tem acesso total",
          });
        }
        if (
          project.participants.some(
            (p) => String(p.email || "").toLowerCase() === email,
          )
        ) {
          return send(res, 400, {
            message: "Usuário já é participante do projeto",
          });
        }
        if (pendingInvitesFor(project.id).some((i) => i.email === email)) {
          return send(res, 400, {
            message: "Já existe um convite pendente para este e-mail",
          });
        }
        if (guestLimitReached(project)) {
          return sendPlanLimitGuests(res, project);
        }
        const id = randomUUID();
        const now = new Date();
        const invite = {
          id,
          projectId: project.id,
          email,
          token: `th_inv_${id.replace(/-/g, "").slice(0, 24)}`,
          status: "PENDING",
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: now.toISOString(),
        };
        invites.set(id, invite);
        return send(res, 201, inviteView(invite));
      }

      if (req.method === "DELETE" && inviteId) {
        const invite = invites.get(inviteId);
        if (
          !invite ||
          invite.projectId !== project.id ||
          invite.status !== "PENDING"
        ) {
          return send(res, 404, { message: "Convite não encontrado" });
        }
        invite.status = "REVOKED";
        const pending = pendingInvitesFor(project.id);
        return send(res, 200, {
          invites: pending.map(inviteView),
          guestUsage: guestUsageFor(project),
        });
      }
    }

    const stagesByProject = /^\/project-stages\/project\/([^/]+)$/.exec(path);
    if (stagesByProject && req.method === "GET") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const projectId = stagesByProject[1];
      const list = [...stages.values()]
        .filter((s) => s.projectId === projectId && !s.deletedAt)
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          id: s.id,
          name: s.name,
          order: s.order,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          deletedAt: null,
        }));
      return send(res, 200, list);
    }

    if (path === "/project-stages" && req.method === "POST") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const body = await readBody(req);
      const project = projects.get(String(body?.projectId));
      if (!project || project.deletedAt) {
        return send(res, 400, { message: "Project not found" });
      }
      if (!canManage(project, user)) {
        return send(res, 403, { message: "Forbidden resource" });
      }
      if (!body?.name?.trim()) {
        return send(res, 422, { message: "should not be empty" });
      }
      const id = String(stageSeq++);
      const stage = {
        id,
        name: body.name.trim(),
        order: Number(body.order) || 0,
        projectId: project.id,
        deletedAt: null,
      };
      stages.set(id, stage);
      return send(res, 201, {
        id: stage.id,
        name: stage.name,
        order: stage.order,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
      });
    }

    const stageMatch = /^\/project-stages\/([^/]+)$/.exec(path);
    if (stageMatch) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const stage = stages.get(stageMatch[1]);
      if (!stage || stage.deletedAt) {
        return send(res, 400, { message: "Project stage not found" });
      }
      const project = projects.get(stage.projectId);
      if (!project || project.deletedAt) {
        return send(res, 400, { message: "Project not found" });
      }

      if (req.method === "PATCH") {
        if (!canManage(project, user)) {
          return send(res, 403, { message: "Forbidden resource" });
        }
        const body = await readBody(req);
        if (body?.name !== undefined) stage.name = body.name;
        if (body?.order !== undefined) stage.order = Number(body.order);
        return send(res, 200, {
          id: stage.id,
          name: stage.name,
          order: stage.order,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          project: { id: project.id },
        });
      }

      if (req.method === "DELETE") {
        if (!canManage(project, user)) {
          return send(res, 403, { message: "Forbidden resource" });
        }
        stage.deletedAt = new Date().toISOString();
        return send(res, 200, {
          id: stage.id,
          name: stage.name,
          order: stage.order,
          deletedAt: stage.deletedAt,
        });
      }
    }

    const tasksByStage = /^\/tasks\/stage\/([^/]+)$/.exec(path);
    if (tasksByStage && req.method === "GET") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const stageId = tasksByStage[1];
      const list = [...tasks.values()]
        .filter((t) => t.stageId === stageId && !t.deletedAt)
        .sort(
          (a, b) =>
            (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id),
        )
        .map(taskView);
      return send(res, 200, list);
    }

    if (path === "/tasks" && req.method === "POST") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const body = await readBody(req);
      const stage = stages.get(String(body?.stageId));
      if (!stage || stage.deletedAt) {
        return send(res, 400, { message: "Stage not found" });
      }
      const project = projects.get(stage.projectId);
      if (!project || project.deletedAt) {
        return send(res, 400, { message: "Project not found" });
      }
      if (
        project.userOwner.id !== user.id &&
        !project.participants.some((p) => p.id === user.id) &&
        user.role !== "ADMIN_GOD" &&
        user.role !== "ADMIN_COLLABORATOR"
      ) {
        return send(res, 403, { message: "Forbidden resource" });
      }
      if (!body?.name?.trim()) {
        return send(res, 422, { message: "should not be empty" });
      }
      const id = String(taskSeq++);
      const maxOrder = Math.max(
        -1,
        ...[...tasks.values()]
          .filter((t) => t.stageId === stage.id && !t.deletedAt)
          .map((t) => t.order ?? 0),
      );
      const task = {
        id,
        name: body.name.trim(),
        description: null,
        finishDate: null,
        completedAt: null,
        order: maxOrder + 1,
        stageId: stage.id,
        userId: user.id,
        deletedAt: null,
      };
      tasks.set(id, task);
      return send(res, 201, taskView(task));
    }

    const completionsMatch = /^\/tasks\/([^/]+)\/completions$/.exec(path);
    if (completionsMatch) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const task = tasks.get(completionsMatch[1]);
      if (!task || task.deletedAt) {
        return send(res, 400, { message: "Task not found" });
      }
      const canMove =
        task.userId === user.id ||
        user.role === "ADMIN_GOD" ||
        user.role === "ADMIN_COLLABORATOR";

      if (req.method === "GET") {
        const list = [...taskCompletions.values()]
          .filter((c) => c.taskId === task.id)
          .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
          .map((c) => {
            const stage = stages.get(c.stageId);
            return {
              id: c.id,
              completedAt: c.completedAt,
              stage: stage
                ? { id: stage.id, name: stage.name, order: stage.order }
                : { id: c.stageId, name: "?" },
            };
          });
        return send(res, 200, list);
      }

      if (req.method === "POST") {
        if (!canMove) {
          return send(res, 403, { message: "Forbidden resource" });
        }
        if (task.completedAt) {
          return send(res, 400, { message: "Tarefa já está concluída" });
        }
        const completedAt = new Date().toISOString();
        task.completedAt = completedAt;
        const cid = String(completionSeq++);
        taskCompletions.set(cid, {
          id: cid,
          taskId: task.id,
          stageId: task.stageId,
          completedAt,
        });
        return send(res, 201, taskView(task));
      }
    }

    const subtasksByTask = /^\/subtasks\/task\/([^/]+)$/.exec(path);
    if (subtasksByTask && req.method === "GET") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const taskId = subtasksByTask[1];
      const task = tasks.get(taskId);
      if (!task || task.deletedAt) {
        return send(res, 400, { message: "Task not found" });
      }
      const list = [...subtasks.values()]
        .filter((s) => s.taskId === taskId && !s.deletedAt)
        .map(subtaskView);
      return send(res, 200, list);
    }

    if (path === "/subtasks" && req.method === "POST") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const body = await readBody(req);
      const task = tasks.get(String(body?.taskId));
      if (!task || task.deletedAt) {
        return send(res, 400, { message: "Task not found" });
      }
      if (!body?.name?.trim()) {
        return send(res, 422, { message: "should not be empty" });
      }
      const id = String(subtaskSeq++);
      const sub = {
        id,
        name: body.name.trim(),
        description: null,
        isCompleted: false,
        taskId: task.id,
        responsibleId: user.id,
        deletedAt: null,
      };
      subtasks.set(id, sub);
      return send(res, 201, subtaskView(sub));
    }

    const subtaskMatch = /^\/subtasks\/([^/]+)$/.exec(path);
    if (subtaskMatch) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const sub = subtasks.get(subtaskMatch[1]);
      if (!sub || sub.deletedAt) {
        return send(res, 400, { message: "Subtask not found" });
      }
      if (sub.responsibleId !== user.id) {
        return send(res, 400, {
          message: "You are not the responsible of this subtask",
        });
      }

      if (req.method === "PATCH") {
        const body = await readBody(req);
        if (body?.name !== undefined) sub.name = body.name;
        if (body?.description !== undefined) {
          sub.description = body.description ?? null;
        }
        if (body?.isCompleted !== undefined) {
          sub.isCompleted = Boolean(body.isCompleted);
        }
        return send(res, 200, { affected: 1 });
      }

      if (req.method === "DELETE") {
        sub.deletedAt = new Date().toISOString();
        return send(res, 200, { affected: 1 });
      }
    }

    const ttList = /^\/tasks\/([^/]+)\/timetrack$/.exec(path);
    if (ttList && req.method === "GET") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const task = tasks.get(ttList[1]);
      if (!task || task.deletedAt) {
        return send(res, 404, { message: "Task not found" });
      }
      const project = projectForTask(task);
      if (!canAccessProject(project, user)) {
        return send(res, 403, {
          message: "Sem permissão para listar timetrack desta tarefa",
        });
      }
      const list = [...timetracks.values()]
        .filter((t) => t.taskId === task.id)
        .map(timetrackView);
      return send(res, 200, list);
    }

    const ttStart = /^\/tasks\/([^/]+)\/timetrack\/start$/.exec(path);
    if (ttStart && req.method === "POST") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const task = tasks.get(ttStart[1]);
      if (!task || task.deletedAt) {
        return send(res, 404, { message: "Task not found" });
      }
      const project = projectForTask(task);
      if (!canAccessProject(project, user)) {
        return send(res, 403, {
          message: "Sem permissão para registrar timetrack nesta tarefa",
        });
      }
      // Auto-stop timers activos do mesmo user
      for (const entry of timetracks.values()) {
        if (entry.userId === user.id && entry.end == null) {
          entry.end = new Date().toISOString();
        }
      }
      const id = String(timetrackSeq++);
      const entry = {
        id,
        taskId: task.id,
        userId: user.id,
        start: new Date().toISOString(),
        end: null,
      };
      timetracks.set(id, entry);
      return send(res, 201, {
        ...timetrackView(entry),
        user: { id: user.id, name: user.name },
        task: { id: task.id },
      });
    }

    const ttStop = /^\/tasks\/([^/]+)\/timetrack\/([^/]+)\/stop$/.exec(path);
    if (ttStop && req.method === "PATCH") {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const task = tasks.get(ttStop[1]);
      const entry = timetracks.get(ttStop[2]);
      if (!task || task.deletedAt || !entry || entry.taskId !== task.id) {
        return send(res, 404, { message: "Timetrack not found" });
      }
      const project = projectForTask(task);
      if (!canAccessProject(project, user)) {
        return send(res, 403, {
          message: "Sem permissão para editar/remover timetrack desta tarefa",
        });
      }
      const manages = canManage(project, user);
      if (entry.userId !== user.id && !manages) {
        return send(res, 403, {
          message:
            "Apenas o usuário que iniciou ou quem gerencia o projeto pode encerrar",
        });
      }
      entry.end = new Date().toISOString();
      return send(res, 200, {
        ...timetrackView(entry),
        user: { id: entry.userId, name: usersById.get(entry.userId)?.name },
      });
    }

    const ttOne = /^\/tasks\/([^/]+)\/timetrack\/([^/]+)$/.exec(path);
    if (ttOne) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const task = tasks.get(ttOne[1]);
      const entry = timetracks.get(ttOne[2]);
      if (!task || task.deletedAt || !entry || entry.taskId !== task.id) {
        return send(res, 404, { message: "Timetrack not found" });
      }
      const project = projectForTask(task);
      if (!canAccessProject(project, user)) {
        return send(res, 403, {
          message: "Sem permissão para editar/remover timetrack desta tarefa",
        });
      }
      const manages = canManage(project, user);
      if (entry.userId !== user.id && !manages) {
        return send(res, 403, {
          message:
            "Apenas o dono do registro ou quem gerencia o projeto pode editar/remover",
        });
      }

      if (req.method === "PATCH") {
        const body = await readBody(req);
        if (body?.end) entry.end = body.end;
        return send(res, 200, timetrackView(entry));
      }

      if (req.method === "DELETE") {
        timetracks.delete(entry.id);
        return send(res, 200, { deleted: true });
      }
    }

    const taskMatch = /^\/tasks\/([^/]+)$/.exec(path);
    if (
      taskMatch &&
      !path.includes("/timetrack") &&
      !path.includes("/completions")
    ) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const task = tasks.get(taskMatch[1]);
      if (!task || task.deletedAt) {
        return send(res, 400, { message: "Task not found" });
      }
      const canMove =
        task.userId === user.id ||
        user.role === "ADMIN_GOD" ||
        user.role === "ADMIN_COLLABORATOR";

      if (req.method === "GET") {
        return send(res, 200, taskView(task));
      }

      if (req.method === "PATCH") {
        const body = await readBody(req);
        if (
          body?.completedAt !== undefined &&
          body.completedAt !== null
        ) {
          return send(res, 400, {
            message: "Use POST /tasks/:id/completions para concluir",
          });
        }
        if (canMove) {
          if (body?.name !== undefined) task.name = body.name;
          if (body?.description !== undefined) {
            task.description = body.description ?? null;
          }
          if (body?.finishDate !== undefined) {
            task.finishDate = body.finishDate ?? null;
          }
          if (body?.completedAt === null) {
            task.completedAt = null;
          }
          const stageChanging =
            body?.stageId !== undefined &&
            String(body.stageId) !== String(task.stageId);
          const orderChanging = body?.order !== undefined;
          if (stageChanging || orderChanging) {
            const targetStageId = stageChanging
              ? String(body.stageId)
              : task.stageId;
            const stage = stages.get(targetStageId);
            if (!stage || stage.deletedAt) {
              return send(res, 400, { message: "Stage not found" });
            }
            placeTaskInStage(
              task,
              targetStageId,
              orderChanging ? body.order : undefined,
            );
          }
        } else {
          if (
            body?.stageId !== undefined ||
            body?.order !== undefined ||
            body?.completedAt !== undefined
          ) {
            return send(res, 403, { message: "Forbidden resource" });
          }
          if (body?.name !== undefined) task.name = body.name;
          if (body?.description !== undefined) {
            task.description = body.description ?? null;
          }
          if (body?.finishDate !== undefined) {
            task.finishDate = body.finishDate ?? null;
          }
        }
        return send(res, 200, taskView(task));
      }

      if (req.method === "DELETE") {
        if (!canMove) {
          return send(res, 403, { message: "Forbidden resource" });
        }
        const stageId = task.stageId;
        task.deletedAt = new Date().toISOString();
        reindexStageTasks(stageId);
        return send(res, 200, taskView(task));
      }
    }

    const projectMatch = /^\/projects\/([^/]+)$/.exec(path);
    if (projectMatch) {
      const user = bearerUser(req);
      if (!user) return send(res, 401, { message: "Unauthorized" });
      const project = projects.get(projectMatch[1]);
      if (!project || project.deletedAt) {
        return send(res, 404, { message: "Projeto não encontrado" });
      }

      if (req.method === "GET") {
        return send(res, 200, {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          deletedAt: project.deletedAt,
        });
      }

      if (req.method === "PATCH") {
        if (!canManage(project, user)) {
          return send(res, 403, { message: "Forbidden resource" });
        }
        const body = await readBody(req);
        if (body?.name !== undefined) project.name = body.name;
        if (body?.description !== undefined) project.description = body.description;
        project.updatedAt = new Date().toISOString();
        return send(res, 200, {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          deletedAt: project.deletedAt,
        });
      }

      if (req.method === "DELETE") {
        if (!canManage(project, user)) {
          return send(res, 403, { message: "Forbidden resource" });
        }
        project.deletedAt = new Date().toISOString();
        return send(res, 200, projectForClient(project));
      }
    }

    send(res, 404, { message: `Mock: rota não implementada ${req.method} ${path}` });
  } catch (err) {
    console.error(err);
    send(res, 500, { message: String(err) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-backend] listening on http://127.0.0.1:${PORT}`);
});
