"use client";

import { useSyncExternalStore } from "react";

import { cartStore } from "@/lib/cart/cart-storage";

export function useCart(merchantSlug: string) {
  const cart = useSyncExternalStore(
    cartStore.subscribe,
    () => cartStore.getSnapshot(merchantSlug),
    () => cartStore.getServerSnapshot(),
  );

  const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  return { cart, itemCount };
}
