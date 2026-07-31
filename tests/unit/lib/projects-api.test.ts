import { describe, expect, it } from "vitest";
import type { ProjectSummary } from "@/lib/api-types";
import { canManageProject } from "@/lib/projects-api";

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
