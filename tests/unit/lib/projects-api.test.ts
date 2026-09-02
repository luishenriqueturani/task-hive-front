import { describe, expect, it, vi } from "vitest";
import type { ProjectSummary } from "@/lib/api-types";
import {
  canManageProject,
  fetchProjects,
  projectsQueryKey,
} from "@/lib/projects-api";

const project: ProjectSummary = {
  id: "1",
  name: "Backlog",
  description: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: null,
  userOwner: {
    id: "owner-1",
    name: "Dono",
    email: "dono@example.com",
  },
  participants: [],
};

describe("canManageProject", () => {
  it("permite ao dono", () => {
    expect(
      canManageProject(project, { id: "owner-1", role: "CLIENT" }),
    ).toBe(true);
  });

  it("permite a ADMIN_GOD e ADMIN_COLLABORATOR", () => {
    expect(
      canManageProject(project, { id: "outro", role: "ADMIN_GOD" }),
    ).toBe(true);
    expect(
      canManageProject(project, {
        id: "outro",
        role: "ADMIN_COLLABORATOR",
      }),
    ).toBe(true);
  });

  it("nega a participante comum", () => {
    expect(
      canManageProject(project, { id: "part-1", role: "CLIENT" }),
    ).toBe(false);
  });

  it("nega sem sessão", () => {
    expect(canManageProject(project, undefined)).toBe(false);
  });
});

describe("fetchProjects", () => {
  it("chave de cache inclui o scope", () => {
    expect(projectsQueryKey("owned")).toEqual(["/projects", "owned"]);
    expect(projectsQueryKey()).toEqual(["/projects", "all"]);
  });

  it("omite query quando scope é all", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(new Response("[]", { status: 200 })),
      ),
    );
    await fetchProjects();
    expect(fetch).toHaveBeenCalledWith("/api/bff/projects", {
      credentials: "include",
    });
  });

  it("pede scope=owned e scope=invited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(new Response("[]", { status: 200 })),
      ),
    );
    await fetchProjects("owned");
    await fetchProjects("invited");
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/bff/projects?scope=owned",
      { credentials: "include" },
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/bff/projects?scope=invited",
      { credentials: "include" },
    );
  });
});
