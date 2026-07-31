import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTaskTimetrackSocket } from "@/lib/use-task-timetrack-socket";

const on = vi.fn();
const off = vi.fn();
const emit = vi.fn();
const disconnect = vi.fn();

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({ on, off, emit, disconnect })),
}));

describe("useTaskTimetrackSocket", () => {
  beforeEach(() => {
    on.mockReset();
    off.mockReset();
    emit.mockReset();
    disconnect.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ wsUrl: "http://ws.test" }), {
          status: 200,
        }),
      ),
    );
  });

  it("liga, faz joinTask e invalida no evento", async () => {
    const { io } = await import("socket.io-client");
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { unmount } = renderHook(
      () => useTaskTimetrackSocket("task-1"),
      { wrapper },
    );

    await waitFor(() => {
      expect(io).toHaveBeenCalledWith(
        "http://ws.test",
        expect.objectContaining({ transports: ["websocket"] }),
      );
      expect(emit).toHaveBeenCalledWith("joinTask", { taskId: "task-1" });
    });

    expect(on).toHaveBeenCalledWith("timetrack:started", expect.any(Function));

    const handler = on.mock.calls.find(
      (c) => c[0] === "timetrack:started",
    )?.[1] as () => void;
    handler();
    expect(invalidate).toHaveBeenCalled();

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
