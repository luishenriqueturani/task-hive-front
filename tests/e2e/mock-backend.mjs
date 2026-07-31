#!/usr/bin/env node
/**
 * Backend mock em memória para smoke E2E do frontend.
 * Port padrão: 4099 (override com MOCK_BACKEND_PORT).
 *
 * Cobre: login, logout, users, projects (CRUD) e check-token/reset-password.
 * Emite JWT fake compatível com decodeSessionUser do BFF.
 */
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_BACKEND_PORT || 4099);

/** @type {Map<string, { id: string, name: string, email: string, password: string, role: string }>} */
const usersByEmail = new Map();
/** @type {Map<string, object>} */
const projects = new Map();
let projectSeq = 1n;

const seed = {
  id: randomUUID(),
  name: "Usuário E2E",
  email: "e2e@taskhive.test",
  password: "SenhaForte123!",
  role: "CLIENT",
};
usersByEmail.set(seed.email, seed);

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
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
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
      usersByEmail.set(email, user);
      return send(res, 201, publicUser(user));
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
        if (project.userOwner.id !== user.id) {
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
        if (project.userOwner.id !== user.id) {
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
