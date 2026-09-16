// Whoever holds the cart token holds the cart — there are no accounts on the
// storefront API — so the id and token are all that is kept locally. The lines
// themselves live on the server.
export type CartSession = {
  cartId: string;
  cartToken: string;
};

const PREFIX = "storefront.cart-session.";

function storageKey(merchantSlug: string) {
  return `${PREFIX}${merchantSlug}`;
}

const cache = new Map<string, CartSession | null>();
const listeners = new Set<() => void>();

function read(merchantSlug: string): CartSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(storageKey(merchantSlug));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CartSession;

    return parsed.cartId && parsed.cartToken ? parsed : null;
  } catch {
    window.localStorage.removeItem(storageKey(merchantSlug));

    return null;
  }
}

export const cartSession = {
  get(merchantSlug: string): CartSession | null {
    if (!cache.has(merchantSlug)) cache.set(merchantSlug, read(merchantSlug));

    return cache.get(merchantSlug) ?? null;
  },

  set(merchantSlug: string, session: CartSession) {
    cache.set(merchantSlug, session);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        storageKey(merchantSlug),
        JSON.stringify(session),
      );
    }

    listeners.forEach((listener) => listener());
  },

  clear(merchantSlug: string) {
    cache.set(merchantSlug, null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey(merchantSlug));
    }

    listeners.forEach((listener) => listener());
  },

  subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(merchantSlug: string) {
    return cartSession.get(merchantSlug);
  },

  getServerSnapshot(): CartSession | null {
    return null;
  },
};
