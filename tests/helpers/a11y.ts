import { axe } from "jest-axe";
import { expect } from "vitest";

/**
 * axe em jsdom: contraste de cores não é fiável sem layout/CSS completo.
 * E2E (Playwright) cobre contraste em páginas reais quando necessário.
 */
const AXE_JSOM_OPTIONS = {
  rules: {
    "color-contrast": { enabled: false },
  },
};

export async function runAxe(container: Element) {
  return axe(container, AXE_JSOM_OPTIONS);
}

export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await runAxe(container);
  expect(results).toHaveNoViolations();
}
