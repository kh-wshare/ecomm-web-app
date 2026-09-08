import type { TelegramWebApp } from "@/lib/telegram/telegram.types";

/**
 * Returns the Telegram WebApp SDK instance, or null outside Telegram / on the server.
 * Never call this during server rendering — it always returns null there by design.
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/**
 * True only when the app is running inside an actual Telegram Mini App session
 * (the SDK is present AND Telegram gave us signed init data to verify).
 */
export function isTelegramMiniApp(): boolean {
  const webApp = getTelegramWebApp();
  return Boolean(webApp && webApp.initData.length > 0);
}

/**
 * The raw, unmodified initData string. This — and only this — is what gets sent
 * to the backend for verification. Never parse/rebuild it, never use
 * `initDataUnsafe` as an auth source.
 */
export function getTelegramInitData(): string | null {
  const webApp = getTelegramWebApp();
  return webApp?.initData || null;
}

/**
 * Tells the Telegram client the app is ready to be displayed and requests the
 * expanded viewport. Safe to call multiple times; a no-op outside Telegram.
 */
export function initializeTelegramWebApp(): TelegramWebApp | null {
  const webApp = getTelegramWebApp();
  if (!webApp) return null;

  webApp.ready();
  webApp.expand();

  return webApp;
}
