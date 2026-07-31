import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GeneratePasswordButton } from "@/components/auth/generate-password-button";

describe("GeneratePasswordButton", () => {
  it("gera senha, chama onGenerate e mostra feedback de cópia", async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    render(<GeneratePasswordButton onGenerate={onGenerate} />);

    await user.click(
      screen.getByRole("button", { name: "Gerar senha segura" }),
    );

    expect(onGenerate).toHaveBeenCalledTimes(1);
    const pwd = onGenerate.mock.calls[0][0] as string;
    expect(pwd.length).toBeGreaterThanOrEqual(8);
    expect(writeText).toHaveBeenCalledWith(pwd);
    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent(/copiada/i);
  });
});
