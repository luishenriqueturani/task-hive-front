import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/ui/modal";

describe("Modal", () => {
  it("renderiza no body via portal", () => {
    render(
      <Modal title="Título" onClose={() => {}}>
        <p>Conteúdo</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: "Título" })).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it("fecha com o botão X", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal title="Título" onClose={onClose}>
        <p>x</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha com Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal title="Título" onClose={onClose}>
        <p>x</p>
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha com clique no backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal title="Título" onClose={onClose}>
        <p>x</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.querySelector("[aria-hidden]") as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
