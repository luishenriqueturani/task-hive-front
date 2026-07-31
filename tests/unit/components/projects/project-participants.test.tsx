import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectParticipants } from "@/components/projects/project-participants";
import type { ProjectSummary } from "@/lib/api-types";
import { renderWithProviders } from "@tests/helpers/render";

const project: ProjectSummary = {
  id: "1",
  name: "Backlog",
  description: null,
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: null,
  userOwner: { id: "owner-1", name: "Ana", email: "ana@example.com" },
  participants: [],
};

const usersList = [
  {
    id: "owner-1",
    name: "Ana",
    email: "ana@example.com",
    avatar: null,
  },
  {
    id: "u2",
    name: "Bob",
    email: "bob@example.com",
    avatar: null,
  },
  {
    id: "u3",
    name: "Carla",
    email: "carla@example.com",
    avatar: null,
  },
];

function mockFetch(opts?: {
  participants?: Array<{ id: string; name: string; email: string; role: string }>;
  addStatus?: number;
  addBody?: unknown;
}) {
  let participants = [...(opts?.participants ?? [])];

  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/users") && method === "GET") {
      return new Response(JSON.stringify(usersList), { status: 200 });
    }

    if (url.includes("/participants") && method === "GET") {
      return new Response(JSON.stringify(participants), { status: 200 });
    }

    if (url.includes("/participants") && method === "POST") {
      if (opts?.addStatus && opts.addStatus >= 400) {
        return new Response(JSON.stringify(opts.addBody ?? { message: "erro" }), {
          status: opts.addStatus,
          headers: { "content-type": "application/json" },
        });
      }
      const body = JSON.parse(String(init?.body)) as { userId: string };
      const user = usersList.find((u) => u.id === body.userId)!;
      participants = [
        ...participants,
        { id: user.id, name: user.name, email: user.email, role: "CLIENT" },
      ];
      return new Response(JSON.stringify(participants), { status: 200 });
    }

    if (url.match(/\/participants\/[^/]+$/) && method === "DELETE") {
      const userId = url.split("/").pop()!;
      participants = participants.filter((p) => p.id !== userId);
      return new Response(JSON.stringify(participants), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  });
}

describe("ProjectParticipants", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("lista dono e participantes da API", async () => {
    mockFetch({
      participants: [
        { id: "u2", name: "Bob", email: "bob@example.com", role: "CLIENT" },
      ],
    });

    renderWithProviders(
      <ProjectParticipants project={project} canManage={false} />,
    );

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Dono")).toBeInTheDocument();
    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Adicionar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Remover Bob/i }),
    ).not.toBeInTheDocument();
  });

  it("mostra Adicionar e Remover para gestor", async () => {
    mockFetch({
      participants: [
        { id: "u2", name: "Bob", email: "bob@example.com", role: "CLIENT" },
      ],
    });

    renderWithProviders(
      <ProjectParticipants project={project} canManage />,
    );

    expect(
      await screen.findByRole("button", { name: /Adicionar/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /Remover Bob/i }),
    ).toBeInTheDocument();
  });

  it("adiciona participante via busca", async () => {
    const user = userEvent.setup();
    mockFetch({ participants: [] });

    renderWithProviders(
      <ProjectParticipants project={project} canManage />,
    );

    await user.click(await screen.findByRole("button", { name: /Adicionar/i }));
    expect(
      screen.getByRole("dialog", { name: "Adicionar participante" }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Buscar por nome ou e-mail"),
      "bob@",
    );

    await user.click(await screen.findByRole("button", { name: /Bob/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Adicionar participante" }),
      ).not.toBeInTheDocument();
    });
    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/projects/1/participants",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("exibe erro da API ao adicionar", async () => {
    const user = userEvent.setup();
    mockFetch({
      participants: [],
      addStatus: 400,
      addBody: { message: "Usuário já é participante do projeto" },
    });

    renderWithProviders(
      <ProjectParticipants project={project} canManage />,
    );

    await user.click(await screen.findByRole("button", { name: /Adicionar/i }));
    await user.click(await screen.findByRole("button", { name: /Bob/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /já é participante/i,
    );
  });

  it("remove participante com confirmação", async () => {
    const user = userEvent.setup();
    mockFetch({
      participants: [
        { id: "u2", name: "Bob", email: "bob@example.com", role: "CLIENT" },
      ],
    });

    renderWithProviders(
      <ProjectParticipants project={project} canManage />,
    );

    await user.click(
      await screen.findByRole("button", { name: /Remover Bob/i }),
    );
    expect(
      screen.getByRole("dialog", { name: "Remover participante" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remover" }));

    await waitFor(() => {
      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/projects/1/participants/u2",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
