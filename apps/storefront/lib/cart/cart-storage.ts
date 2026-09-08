export type CartItem = {
  productId: string;
  variantId?: string;
  productSlug: string;
  name: string;
  variantName?: string;
  image?: string;
  sku: string;
  price: string;
  currency: string;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
};

const PREFIX = "storefront.cart.";
const EMPTY_CART: Cart = { items: [] };

function storageKey(merchantSlug: string) {
  return `${PREFIX}${merchantSlug}`;
}

function readCart(merchantSlug: string): Cart {
  if (typeof window === "undefined") return EMPTY_CART;

  const raw = window.localStorage.getItem(storageKey(merchantSlug));
  if (!raw) return EMPTY_CART;

  try {
    const parsed = JSON.parse(raw) as Cart;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    window.localStorage.removeItem(storageKey(merchantSlug));
    return EMPTY_CART;
  }
}

function itemKey(item: Pick<CartItem, "productId" | "variantId">) {
  return `${item.productId}:${item.variantId ?? ""}`;
}

const cache = new Map<string, Cart>();
const listeners = new Set<() => void>();

function getCart(merchantSlug: string): Cart {
  if (!cache.has(merchantSlug)) {
    cache.set(merchantSlug, readCart(merchantSlug));
  }
  return cache.get(merchantSlug) ?? EMPTY_CART;
}

function writeCart(merchantSlug: string, cart: Cart) {
  cache.set(merchantSlug, cart);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(merchantSlug), JSON.stringify(cart));
  }

  listeners.forEach((listener) => listener());
}

export const cartStore = {
  getSnapshot(merchantSlug: string): Cart {
    return getCart(merchantSlug);
  },

  getServerSnapshot(): Cart {
    return EMPTY_CART;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  addItem(merchantSlug: string, item: CartItem) {
    const cart = getCart(merchantSlug);
    const existing = cart.items.find((i) => itemKey(i) === itemKey(item));

    const items = existing
      ? cart.items.map((i) =>
          itemKey(i) === itemKey(item)
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        )
      : [...cart.items, item];

    writeCart(merchantSlug, { items });
  },

  setQuantity(
    merchantSlug: string,
    target: Pick<CartItem, "productId" | "variantId">,
    quantity: number,
  ) {
    const cart = getCart(merchantSlug);
    const items =
      quantity <= 0
        ? cart.items.filter((i) => itemKey(i) !== itemKey(target))
        : cart.items.map((i) =>
            itemKey(i) === itemKey(target) ? { ...i, quantity } : i,
          );

    writeCart(merchantSlug, { items });
  },

  removeItem(
    merchantSlug: string,
    target: Pick<CartItem, "productId" | "variantId">,
  ) {
    const cart = getCart(merchantSlug);
    writeCart(merchantSlug, {
      items: cart.items.filter((i) => itemKey(i) !== itemKey(target)),
    });
  },

  clear(merchantSlug: string) {
    writeCart(merchantSlug, EMPTY_CART);
  },
};
