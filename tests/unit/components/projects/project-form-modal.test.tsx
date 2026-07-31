import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectSummary } from "@/lib/api-types";
import { renderWithProviders } from "@tests/helpers/render";
import { ProjectFormModal } from "@/components/projects/project-form-modal";

const project: ProjectSummary = {
  id: "42",
  name: "Backlog",
  description: "Desc",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: null,
  userOwner: { id: "u1", name: "Ana", email: "a@b.com" },
  participants: [],
};

describe("ProjectFormModal", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("cria projeto via POST", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ...project, name: "Novo" }), {
        status: 201,
      }),
    );

    renderWithProviders(<ProjectFormModal onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Novo projeto" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome"), "Novo");
    await user.click(screen.getByRole("button", { name: "Criar projeto" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/projects",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("edita projeto via PATCH com campos pré-preenchidos", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ...project, name: "Backlog 2" }), {
        status: 200,
      }),
    );

    renderWithProviders(
      <ProjectFormModal project={project} onClose={onClose} />,
    );

    expect(screen.getByRole("dialog", { name: "Editar projeto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Backlog");
    expect(screen.getByLabelText(/Descrição/)).toHaveValue("Desc");

    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Backlog 2");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/projects/42",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("exibe erro da API", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Forbidden resource" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );

    renderWithProviders(<ProjectFormModal onClose={() => {}} />);

    await user.type(screen.getByLabelText("Nome"), "X");
    await user.click(screen.getByRole("button", { name: "Criar projeto" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /não tem permissão/i,
    );
  });
});
