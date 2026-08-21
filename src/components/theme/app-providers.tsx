"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { HttpRequestError } from "@/lib/api-error";

/**
 * Provedores do cliente: React Query e tema claro/escuro (next-themes); paleta Soft Pearl no CSS.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            // Evita tempestade de pedidos quando o throttler devolve 429.
            retry: (failureCount, error) => {
              if (error instanceof HttpRequestError && error.status === 429) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
