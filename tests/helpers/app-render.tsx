import { ThemeProvider } from "next-themes";
import { renderWithProviders } from "@tests/helpers/render";

/** Render com React Query + tema (como `AppProviders` em produção). */
export function renderWithAppProviders(ui: React.ReactElement) {
  return renderWithProviders(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {ui}
    </ThemeProvider>,
  );
}
