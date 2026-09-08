"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button, useOverlayState } from "@heroui/react";

import type { PublicMerchant } from "@/types/storefront";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";
import { radiusValue } from "@/lib/theme/radius";
import { formatCurrency } from "@/lib/formatters/currency";
import { useCart } from "@/lib/cart/use-cart";
import { CartModal } from "@/components/storefront/cart-modal";

export function CartContent({
  config,
  merchant,
}: {
  config: ReturnType<typeof normalizeThemeConfig>;
  merchant: PublicMerchant;
}) {
  const { cart, itemCount } = useCart(merchant.slug);
  const cartModal = useOverlayState({ defaultOpen: false });

  const subtotal = cart.items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );
  const currency = cart.items[0]?.currency ?? "USD";

  if (cart.items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-5 pb-24 pt-16 text-center sm:px-8 md:pb-16">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Icon icon="solar:cart-large-2-linear" className="text-2xl" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="text-sm text-default-500">
          Items you add to your cart will show up here.
        </p>
        <Link href={`/${merchant.slug}`} className="mt-2">
          <Button size="sm" variant="primary">
            Start shopping
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-6 sm:px-8 sm:pt-8 md:pb-16">
      <h1
        className="text-2xl font-semibold tracking-tight sm:text-3xl"
        style={{
          fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
        }}
      >
        Your cart
      </h1>

      <div
        className="mt-6 flex items-center gap-4 rounded-2xl border p-5"
        style={{
          borderColor: `color-mix(in srgb, ${config.colors.text} 12%, transparent)`,
        }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm text-default-500">
            {itemCount} item{itemCount === 1 ? "" : "s"} in your cart
          </p>
          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(subtotal, currency)}
          </p>
          <p className="mt-1 text-xs text-default-500">
            Taxes and fees are calculated at checkout.
          </p>
        </div>

        <Button
          className="h-12 shrink-0 px-6 text-sm font-bold text-white"
          style={{
            backgroundColor: config.colors.primary,
            borderRadius: radiusValue(config.layout.borderRadius),
          }}
          type="button"
          variant="primary"
          onPress={cartModal.open}
        >
          View items
        </Button>
      </div>

      <CartModal config={config} merchant={merchant} state={cartModal} />
    </main>
  );
}
