"use client";

import type { ThemeProviderProps } from "next-themes";
import type { ReactNode } from "react";

import { ToastProvider } from "@repo/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useState } from "react";

import { createQueryClient } from "@repo/query-client";
import { TelegramAuthProvider } from "@/components/auth/telegram-auth-provider";

type ProvidersProps = {
  children: ReactNode;
  themeProps?: ThemeProviderProps;
};

export function Providers({ children, themeProps }: ProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider {...themeProps}>
        <TelegramAuthProvider>
          {children}
        </TelegramAuthProvider>
        <ToastProvider placement="top end" />
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
