import { describe, expect, it } from "vitest";
import type { TimetrackEntry } from "@/lib/api-types";
import {
  canManageTimetrack,
  formatDuration,
  isTimetrackActive,
} from "@/lib/timetrack-api";

const entry: TimetrackEntry = {
  id: "1",
  start: "2026-07-31T10:00:00.000Z",
  end: null,
  userId: "u1",
  userName: "Ana",
};

describe("timetrack-api helpers", () => {
  it("detecta registo activo", () => {
    expect(isTimetrackActive(entry)).toBe(true);
    expect(isTimetrackActive({ ...entry, end: "2026-07-31T11:00:00.000Z" })).toBe(
      false,
    );
  });

  it("canManageTimetrack: dono ou gestor do projeto", () => {
    expect(canManageTimetrack(entry, { id: "u1" }, false)).toBe(true);
    expect(canManageTimetrack(entry, { id: "other" }, false)).toBe(false);
    expect(canManageTimetrack(entry, { id: "other" }, true)).toBe(true);
    expect(canManageTimetrack(entry, undefined, true)).toBe(false);
  });

  it("formatDuration", () => {
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(3_661_000)).toBe("1:01:01");
    expect(formatDuration(-10)).toBe("0:00");
  });
});
