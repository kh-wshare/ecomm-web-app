"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { telegramLoginMessageType } from "@/lib/auth/social-providers";

/**
 * The redirect target for the Telegram OAuth popup flow (see getTelegramIdToken
 * in lib/auth/social-providers.ts). This page's only job is to hand the
 * authorization code/state (or an error) back to the window that opened the
 * popup via postMessage, then close itself — it never runs any app logic
 * itself.
 */
export default function TelegramCallbackPage() {
    return (
        <Suspense fallback={null}>
            <TelegramCallbackContent />
        </Suspense>
    );
}

function TelegramCallbackContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Signing you in...");

    useEffect(() => {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error") ?? searchParams.get("error_description");

        if (!window.opener) {
            setStatus("This window was opened without a parent. Please close it and try again.");
            return;
        }

        window.opener.postMessage(
            {
                type: telegramLoginMessageType,
                ...(code ? { code } : {}),
                ...(state ? { state } : {}),
                ...(error ? { error } : {}),
            },
            decodeOriginFromState(state),
        );

        setStatus(error ? "Sign-in failed. You can close this window." : "Signed in — you can close this window.");
        window.close();
    }, [searchParams]);

    return (
        <main className="flex min-h-dvh items-center justify-center px-6 text-center text-sm text-muted">
            <p>{status}</p>
        </main>
    );
}

// The state param embeds the opener's origin (base64url, after the last ".")
// so this popup can target postMessage precisely instead of using "*".
function decodeOriginFromState(state: string | null): string {
    if (!state) return "*";

    const encodedOrigin = state.slice(state.indexOf(".") + 1);
    if (!encodedOrigin || encodedOrigin === state) return "*";

    try {
        const base64 = encodedOrigin.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        return atob(padded);
    } catch {
        return "*";
    }
}
