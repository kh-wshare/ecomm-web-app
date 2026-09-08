"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  customerSessionQueryKey,
  getCustomerSession,
  loginTelegramMiniAppSession,
} from "@/lib/storefront/customer-session";
import {
  getTelegramInitData,
  initializeTelegramWebApp,
  isTelegramMiniApp,
} from "@/lib/telegram/telegram";

export type TelegramAuthStatus =
  | "idle"
  | "initializing"
  | "authenticating"
  | "authenticated"
  | "unauthenticated"
  | "error";

/**
 * Silently signs the customer in via Telegram when the app is opened as a
 * Telegram Mini App, reusing the existing customer-session React Query cache
 * as the single source of truth — there is no separate Telegram auth store.
 *
 * Outside Telegram this is a no-op: `status` settles on "unauthenticated" and
 * the existing browser login flow (Google/Telegram OAuth popup) is untouched.
 *
 * The login attempt runs at most once automatically; call `retry()` to try
 * again after a failure (e.g. from a "Try again" button).
 */
export function useTelegramAuth() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TelegramAuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const hasAttempted = useRef(false);

  const customerQuery = useQuery({
    queryKey: customerSessionQueryKey,
    queryFn: getCustomerSession,
  });

  const loginMutation = useMutation({
    mutationFn: loginTelegramMiniAppSession,
    retry: false,
    onSuccess: (session) => {
      queryClient.setQueryData(customerSessionQueryKey, session);
      setError(null);
      setStatus("authenticated");
    },
    onError: (mutationError) => {
      setStatus("error");
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to authenticate with Telegram.",
      );
    },
  });

  const attemptLogin = () => {
    if (!isTelegramMiniApp()) {
      setStatus("unauthenticated");
      return;
    }

    const initData = getTelegramInitData();
    if (!initData) {
      setStatus("error");
      setError("Telegram authentication data is unavailable.");
      return;
    }

    setError(null);
    setStatus("authenticating");
    loginMutation.mutate(initData);
  };

  // Tell Telegram the app is ready / request the expanded viewport. Harmless
  // no-op outside Telegram. Independent of auth status — this is UI lifecycle,
  // not authentication.
  useEffect(() => {
    initializeTelegramWebApp();
  }, []);

  // Auto-login exactly once, only once we know whether a session already
  // exists (avoids logging in again on top of an existing browser session).
  useEffect(() => {
    if (hasAttempted.current) return;
    if (customerQuery.isPending) return;

    hasAttempted.current = true;

    if (customerQuery.data) {
      setStatus("authenticated");
      return;
    }

    setStatus("initializing");
    attemptLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerQuery.isPending, customerQuery.data]);

  const retry = () => {
    if (loginMutation.isPending) return;
    attemptLogin();
  };

  return {
    error,
    isAuthenticated: Boolean(customerQuery.data),
    isLoading: status === "initializing" || status === "authenticating",
    retry,
    status,
    user: customerQuery.data?.user ?? null,
  };
}
