import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordField } from "@/components/auth/form-field";

describe("PasswordField", () => {
  it("começa como type=password e alterna para text", async () => {
    const user = userEvent.setup();
    render(
      <PasswordField
        id="pwd"
        label="Senha"
        value="segredo"
        onChange={() => {}}
      />,
    );

    const input = screen.getByLabelText("Senha");
    expect(input).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: "Mostrar senha" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Ocultar senha" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
