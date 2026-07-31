import { describe, expect, it } from "vitest";
import type { TaskSummary } from "@/lib/api-types";
import { canMoveOrRemoveTask } from "@/lib/tasks-api";

const task: TaskSummary = {
  id: "t1",
  name: "Task",
  user: { id: "owner-1" },
  stage: { id: "s1", name: "Todo", order: 0 },
};

describe("canMoveOrRemoveTask", () => {
  it("permite ao dono da tarefa", () => {
    expect(
      canMoveOrRemoveTask(task, { id: "owner-1", role: "CLIENT" }),
    ).toBe(true);
  });

  it("permite a admins", () => {
    expect(
      canMoveOrRemoveTask(task, { id: "x", role: "ADMIN_GOD" }),
    ).toBe(true);
  });

  it("nega a outros utilizadores", () => {
    expect(
      canMoveOrRemoveTask(task, { id: "other", role: "CLIENT" }),
    ).toBe(false);
    expect(canMoveOrRemoveTask(task, undefined)).toBe(false);
  });
});
