import "@testing-library/jest-dom/vitest";
import "./setup-mocks";
import { toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";

expect.extend(toHaveNoViolations);
