import { describe, expect, it } from "vitest";
import type { SubtaskSummary } from "@/lib/api-types";
import { canManageSubtask } from "@/lib/subtasks-api";

const subtask: SubtaskSummary = {
  id: "s1",
  name: "Revisar PR",
  isCompleted: false,
  responsible: { id: "owner-1", name: "Ana" },
};

describe("canManageSubtask", () => {
  it("permite ao responsável", () => {
    expect(canManageSubtask(subtask, { id: "owner-1" })).toBe(true);
  });

  it("nega a outros utilizadores", () => {
    expect(canManageSubtask(subtask, { id: "other" })).toBe(false);
    expect(canManageSubtask(subtask, undefined)).toBe(false);
  });

  it("nega sem responsável na subtarefa", () => {
    expect(
      canManageSubtask(
        { ...subtask, responsible: null },
        { id: "owner-1" },
      ),
    ).toBe(false);
  });
});
