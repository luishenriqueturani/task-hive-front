import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderActiveTimer } from "@/components/layout/header-active-timer";
import { ACTIVE_TIMER_QUERY_KEY } from "@/lib/active-timer";
import { renderWithProviders } from "@tests/helpers/render";

describe("HeaderActiveTimer", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("não renderiza sem timer activo", async () => {
    const { queryClient } = renderWithProviders(<HeaderActiveTimer />);
    queryClient.setQueryData(ACTIVE_TIMER_QUERY_KEY, null);
    await waitFor(() => {
      expect(screen.queryByLabelText(/Timer em curso/i)).not.toBeInTheDocument();
    });
  });

  it("mostra duração e permite parar", async () => {
    const user = userEvent.setup();
    const start = new Date(Date.now() - 90_000).toISOString();
    const stored = { taskId: "t1", id: "10", start };
    sessionStorage.setItem("th_active_timer", JSON.stringify(stored));

    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (url.includes("/stop") && method === "PATCH") {
        return new Response(
          JSON.stringify({
            id: "10",
            start,
            end: new Date().toISOString(),
            userId: "u1",
            userName: "Ana",
          }),
          { status: 200 },
        );
      }
      if (url.includes("/timetrack") && method === "GET") {
        return new Response(
          JSON.stringify([
            {
              id: "10",
              start,
              end: null,
              userId: "u1",
              userName: "Ana",
            },
          ]),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const { queryClient } = renderWithProviders(<HeaderActiveTimer />);

    expect(await screen.findByLabelText(/Timer em curso/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Parar timer" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/tasks/t1/timetrack/10/stop",
        expect.objectContaining({ method: "PATCH" }),
      );
      expect(queryClient.getQueryData(ACTIVE_TIMER_QUERY_KEY)).toBeNull();
    });
  });
});
