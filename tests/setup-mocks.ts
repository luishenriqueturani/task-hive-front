import React from "react";
import { vi } from "vitest";

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

vi.mock("next/image", () => ({
  default: function MockNextImage({
    src,
    alt,
    priority: _priority,
    sizes: _sizes,
    ...rest
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src?: string | { src?: string };
    priority?: boolean;
    sizes?: string;
  }) {
    const resolved =
      typeof src === "string"
        ? src
        : src && typeof src === "object" && "src" in src
          ? String(src.src)
          : undefined;

    return React.createElement("img", {
      src: resolved,
      alt: alt ?? "",
      ...rest,
    });
  },
}));
