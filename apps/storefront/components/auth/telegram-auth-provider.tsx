"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useTelegramAuth } from "@/hooks/use-telegram-auth";

type TelegramAuthContextValue = ReturnType<typeof useTelegramAuth>;

const TelegramAuthContext = createContext<TelegramAuthContextValue | null>(null);

/**
 * Owns the single Telegram Mini App auto-login attempt for the whole app.
 * Always renders `children` immediately — this is a public storefront, so
 * Telegram sign-in happens silently in the background rather than gating the
 * UI behind a splash screen. Components that care about the outcome (e.g. to
 * show a "signing you in" hint, or a retry action) can read it via
 * `useTelegramAuthStatus()`; everything else should keep reading the
 * customer session the normal way (it updates the same query cache).
 */
export function TelegramAuthProvider({ children }: { children: ReactNode }) {
    const auth = useTelegramAuth();

    return (
        <TelegramAuthContext.Provider value={auth}>
            {children}
        </TelegramAuthContext.Provider>
    );
}

export function useTelegramAuthStatus() {
    const context = useContext(TelegramAuthContext);

    if (!context) {
        throw new Error("useTelegramAuthStatus must be used within a TelegramAuthProvider");
    }

    return context;
}
