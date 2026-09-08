"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Alert, Button, Modal, useOverlayState } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";

import type { PublicMerchant } from "@/types/storefront";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";
import { radiusValue } from "@/lib/theme/radius";
import { formatCurrency } from "@/lib/formatters/currency";
import { getErrorMessage } from "@/lib/errors/api-error";
import { createCheckoutSession } from "@/lib/checkout/checkout-data";
import { checkoutStorage } from "@/lib/checkout/checkout-storage";
import { getCustomerSession } from "@/lib/storefront/customer-session";
import { cartStore, type CartItem } from "@/lib/cart/cart-storage";
import { useCart } from "@/lib/cart/use-cart";

export function CartModal({
  config,
  merchant,
  state,
}: {
  config: ReturnType<typeof normalizeThemeConfig>;
  merchant: PublicMerchant;
  state: ReturnType<typeof useOverlayState>;
}) {
  const router = useRouter();
  const { cart } = useCart(merchant.slug);

  // Auto-close the sheet if the cart empties out while it's open (e.g. the
  // user removes the last item). Opening it on an already-empty cart is a
  // normal state (shows the empty view) — only the >0 → 0 transition closes it.
  const previousItemCountRef = useRef(cart.items.length);
  useEffect(() => {
    const previousCount = previousItemCountRef.current;
    previousItemCountRef.current = cart.items.length;

    if (state.isOpen && previousCount > 0 && cart.items.length === 0) {
      state.close();
    }
  }, [cart.items.length, state]);

  const subtotal = cart.items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );
  const currency = cart.items[0]?.currency ?? "USD";

  const checkout = useMutation({
    mutationFn: async () => {
      const customer = (await getCustomerSession())?.user;

      return createCheckoutSession({
        merchantSlug: merchant.slug,
        ...(customer
          ? {
              customerEmail: customer.email,
              customerId: customer.id,
              customerName: customer.fullName,
              ...(customer.phone ? { customerPhone: customer.phone } : {}),
            }
          : {}),
        sourceChannel: "WEBSITE",
        items: cart.items.map((item) => ({
          productId: item.productId,
          ...(item.variantId ? { variantId: item.variantId } : {}),
          quantity: item.quantity,
        })),
      });
    },

    onSuccess: (session) => {
      checkoutStorage.set(session.id, {
        token: session.checkoutToken,
        merchantSlug: merchant.slug,
      });

      cartStore.clear(merchant.slug);
      state.close();
      router.push(`/checkout/${session.id}`);
    },
  });

  return (
    <Modal isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Backdrop>
        <Modal.Container placement="bottom" className="p-0 sm:items-center sm:p-10">
          <Modal.Dialog className="w-full max-w-full rounded-t-3xl rounded-b-none pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:max-w-md sm:rounded-3xl sm:pb-6">
            <div className="mx-auto -mt-1 mb-3 h-1.5 w-10 shrink-0 rounded-full bg-default-200 sm:hidden" />

            <Modal.CloseTrigger />

            <Modal.Header>
              <h2 className="text-lg font-semibold">Your cart</h2>
            </Modal.Header>

            <Modal.Body>
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon icon="solar:cart-large-2-linear" className="text-xl" />
                  </div>
                  <p className="text-sm font-medium">Your cart is empty</p>
                  <p className="text-xs text-default-500">
                    Items you add to your cart will show up here.
                  </p>
                  <Link href={`/${merchant.slug}`} onClick={state.close}>
                    <Button size="sm" variant="primary">
                      Start shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
                    {cart.items.map((item) => (
                      <CartModalRow
                        item={item}
                        key={`${item.productId}:${item.variantId ?? ""}`}
                        merchantSlug={merchant.slug}
                        onNavigate={state.close}
                      />
                    ))}
                  </div>

                  <div
                    className="mt-4 flex items-center justify-between border-t pt-3 text-sm font-semibold"
                    style={{
                      borderColor: `color-mix(in srgb, ${config.colors.text} 12%, transparent)`,
                    }}
                  >
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                  </div>

                  {checkout.isError && (
                    <Alert className="mt-4" status="danger">
                      <Alert.Content>
                        <Alert.Title>We could not start checkout</Alert.Title>
                        <Alert.Description>{getErrorMessage(checkout.error)}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  )}
                </>
              )}
            </Modal.Body>

            {cart.items.length > 0 && (
              <Modal.Footer>
                <Button
                  className="h-12 w-full text-sm font-bold text-white"
                  isDisabled={checkout.isPending}
                  style={{
                    backgroundColor: config.colors.primary,
                    borderRadius: radiusValue(config.layout.borderRadius),
                  }}
                  type="button"
                  variant="primary"
                  onPress={() => checkout.mutate()}
                >
                  {checkout.isPending ? "Preparing checkout..." : "Checkout"}
                </Button>
              </Modal.Footer>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function CartModalRow({
  item,
  merchantSlug,
  onNavigate,
}: {
  item: CartItem;
  merchantSlug: string;
  onNavigate?: () => void;
}) {
  const target = { productId: item.productId, variantId: item.variantId };
  const lineTotal = Number(item.price) * item.quantity;

  return (
    <div className="flex items-center gap-3">
      <Link
        className="block size-14 shrink-0 overflow-hidden rounded-xl bg-black/5 bg-cover bg-center"
        href={`/${merchantSlug}/products/${item.productSlug}`}
        style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined}
        onClick={onNavigate}
      />

      <div className="min-w-0 flex-1">
        <Link
          className="line-clamp-1 text-sm font-semibold"
          href={`/${merchantSlug}/products/${item.productSlug}`}
          onClick={onNavigate}
        >
          {item.name}
        </Link>
        <p className="mt-0.5 text-xs text-default-500">
          {item.variantName ? `${item.variantName} · ` : ""}
          {item.sku}
        </p>
        <p className="mt-1 text-sm font-semibold">
          {formatCurrency(lineTotal, item.currency)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          aria-label={`Remove ${item.name} from cart`}
          className="text-default-400 transition-colors hover:text-danger"
          type="button"
          onClick={() => cartStore.removeItem(merchantSlug, target)}
        >
          <Icon icon="solar:trash-bin-minimalistic-outline" className="size-4" />
        </button>

        <div className="flex items-center gap-1">
          <button
            aria-label="Decrease quantity"
            className="grid size-6 place-items-center rounded-full border border-default-200 disabled:opacity-40"
            disabled={item.quantity <= 1}
            type="button"
            onClick={() =>
              cartStore.setQuantity(merchantSlug, target, item.quantity - 1)
            }
          >
            <Icon icon="gravity-ui:minus" className="size-3" />
          </button>
          <span className="w-4 text-center text-xs font-medium">{item.quantity}</span>
          <button
            aria-label="Increase quantity"
            className="grid size-6 place-items-center rounded-full border border-default-200"
            type="button"
            onClick={() =>
              cartStore.setQuantity(merchantSlug, target, item.quantity + 1)
            }
          >
            <Icon icon="gravity-ui:plus" className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
