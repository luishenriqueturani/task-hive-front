import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InviteAcceptView } from "@/components/invites/invite-accept-view";
import { renderWithProviders } from "@tests/helpers/render";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const sessionUser = {
  id: "u1",
  name: "Bob",
  email: "bob@example.com",
  role: "CLIENT",
  accountKind: "INDIVIDUAL",
  company: null,
  plan: null,
};

function mockApis(opts: {
  session?: typeof sessionUser | null;
  previewStatus?: number;
  acceptStatus?: number;
}) {
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/api/auth/me")) {
      if (!opts.session) {
        return new Response("{}", { status: 401 });
      }
      return new Response(JSON.stringify({ user: opts.session }), {
        status: 200,
      });
    }

    if (url.includes("/accept") && method === "POST") {
      if (opts.acceptStatus && opts.acceptStatus >= 400) {
        return new Response(
          JSON.stringify({ message: "Este convite é para outro e-mail." }),
          { status: opts.acceptStatus },
        );
      }
      return new Response(
        JSON.stringify({ projectId: "1", projectName: "Backlog" }),
        { status: 200 },
      );
    }

    if (url.includes("/invites/")) {
      if (opts.previewStatus && opts.previewStatus >= 400) {
        return new Response("{}", { status: opts.previewStatus });
      }
      return new Response(
        JSON.stringify({
          email: "bob@example.com",
          projectName: "Backlog",
        }),
        { status: 200 },
      );
    }

    return new Response("not found", { status: 404 });
  });
}

describe("InviteAcceptView", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("sem sessão mostra o projecto e links com next=", async () => {
    mockApis({ session: null });
    renderWithProviders(<InviteAcceptView token="th_inv_abc" />);

    expect(
      await screen.findByText(/Foi convidado para “Backlog”/),
    ).toBeInTheDocument();
    const login = screen.getByRole("link", { name: "Entrar" });
    expect(login).toHaveAttribute(
      "href",
      "/login?next=%2Finvite%2Fth_inv_abc",
    );
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
      "href",
      expect.stringContaining("invite=th_inv_abc"),
    );
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
      "href",
      expect.stringContaining("next=%2Finvite%2Fth_inv_abc"),
    );
  });

  it("com sessão aceita e vai ao projecto", async () => {
    const user = userEvent.setup();
    mockApis({ session: sessionUser });
    renderWithProviders(<InviteAcceptView token="th_inv_abc" />);

    await user.click(
      await screen.findByRole("button", { name: "Aceitar convite" }),
    );
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/projects/1");
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/invites/th_inv_abc/accept",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("convite inválido", async () => {
    mockApis({ session: null, previewStatus: 404 });
    renderWithProviders(<InviteAcceptView token="bad" />);

    expect(await screen.findByText("Convite inválido")).toBeInTheDocument();
  });

  it("sessão com outro e-mail não mostra Aceitar", async () => {
    mockApis({
      session: { ...sessionUser, email: "outra@example.com" },
    });
    renderWithProviders(<InviteAcceptView token="th_inv_abc" />);

    expect(
      await screen.findByText(/autenticado com outra conta/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aceitar convite" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir ao painel" })).toBeInTheDocument();
  });
});
