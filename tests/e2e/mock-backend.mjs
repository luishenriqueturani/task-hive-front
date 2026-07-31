#!/usr/bin/env node
/**
 * Backend mock em memória para smoke E2E do frontend.
 * Port padrão: 4099 (override com MOCK_BACKEND_PORT).
 *
 * Cobre: login, logout, users, projects (CRUD + participantes) e
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
/** @type {Map<string, { id: string, name: string, description: string | null, finishDate: string | null, stageId: string, userId: string, deletedAt: string | null }>} */
const tasks = new Map();
/** @type {Map<string, { id: string, name: string, description: string | null, isCompleted: boolean, taskId: string, responsibleId: string, deletedAt: string | null }>} */
const subtasks = new Map();
/** @type {Map<string, { id: string, taskId: string, userId: string, start: string, end: string | null }>} */
const timetracks = new Map();
/** @type {Map<string, object>} */
const todos = new Map();
let projectSeq = 1n;
let stageSeq = 1n;
let taskSeq = 1n;
let subtaskSeq = 1n;
let timetrackSeq = 1n;
let todoSeq = 1n;

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
    stage: stage
      ? { id: stage.id, name: stage.name, order: stage.order }
      : null,
    user: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    deletedAt: task.deletedAt,
  };
}

function registerUser(user) {
  usersByEmail.set(user.email, user);
  usersById.set(user.id, user);
}

const seed = {
  id: randomUUID(),
  name: "Usuário E2E",
  email: "e2e@taskhive.test",
  password: "SenhaForte123!",
  role: "CLIENT",
};
registerUser(seed);

const seedColleague = {
  id: randomUUID(),
  name: "Colega E2E",
  email: "colega@taskhive.test",
  password: "SenhaForte123!",
  role: "CLIENT",
};
registerUser(seedColleague);

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
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });
  return `${header}.${payload}.mocksig`;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: null,
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

    if (req.method === "POST" && path === "/auth/login") {
      const body = await readBody(req);
      const user = usersByEmail.get(String(body?.email || "").toLowerCase());
      if (!user || user.password !== body?.password) {
        return send(res, 401, { message: "E-mail ou senha inválidos." });
      }
      return send(res, 200, { token: makeJwt(user), user: publicUser(user) });
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
      return send(res, 200, { token: makeJwt(user), user: publicUser(user) });
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
      };
      registerUser(user);
      return send(res, 201, publicUser(user));
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
      const list = [...projects.values()]
        .filter((p) => !p.deletedAt)
        .filter(
          (p) =>
            p.userOwner.id === user.id ||
            p.participants.some((part) => part.id === user.id),
        )
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
        project.participants.push(publicUser(toAdd));
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
      const task = {
        id,
        name: body.name.trim(),
        description: null,
        finishDate: null,
        stageId: stage.id,
        userId: user.id,
        deletedAt: null,
      };
      tasks.set(id, task);
      return send(res, 201, taskView(task));
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
    if (taskMatch && !path.includes("/timetrack")) {
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
        if (canMove) {
          if (body?.name !== undefined) task.name = body.name;
          if (body?.description !== undefined) {
            task.description = body.description ?? null;
          }
          if (body?.finishDate !== undefined) {
            task.finishDate = body.finishDate ?? null;
          }
          if (body?.stageId !== undefined) {
            const stage = stages.get(String(body.stageId));
            if (!stage || stage.deletedAt) {
              return send(res, 400, { message: "Stage not found" });
            }
            task.stageId = stage.id;
          }
        } else {
          // participante: só metadados
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
        task.deletedAt = new Date().toISOString();
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
