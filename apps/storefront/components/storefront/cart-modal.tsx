"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Alert, Button, Modal, useOverlayState } from "@heroui/react";

import type { PublicMerchant } from "@/types/storefront";
import type { CartLine } from "@/types/cart";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";
import { radiusValue } from "@/lib/theme/radius";
import { formatCurrency } from "@/lib/formatters/currency";
import { getErrorMessage } from "@/lib/errors/api-error";
import { useCart, useUpdateCartItem } from "@/lib/cart/use-cart";

export function CartModal({
  config,
  merchant,
  state,
}: {
  config: ReturnType<typeof normalizeThemeConfig>;
  merchant: PublicMerchant;
  state: ReturnType<typeof useOverlayState>;
}) {
  const { cart } = useCart(merchant.slug);
  const updateItem = useUpdateCartItem(merchant.slug);
  const lines = cart?.items ?? [];

  // Auto-close the sheet if the cart empties out while it's open (e.g. the
  // user removes the last item). Opening it on an already-empty cart is a
  // normal state (shows the empty view) — only the >0 → 0 transition closes it.
  const previousItemCountRef = useRef(lines.length);
  useEffect(() => {
    const previousCount = previousItemCountRef.current;
    previousItemCountRef.current = lines.length;

    if (state.isOpen && previousCount > 0 && lines.length === 0) {
      state.close();
    }
  }, [lines.length, state]);

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
              {lines.length === 0 ? (
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
                    {lines.map((line) => (
                      <CartModalRow
                        currency={cart?.currency ?? "USD"}
                        isPending={updateItem.isPending}
                        key={line.id ?? `${line.productId}:${line.variantId ?? ""}`}
                        line={line}
                        onQuantityChange={(quantity) => {
                          if (!line.id) return;
                          updateItem.mutate({ itemId: line.id, quantity });
                        }}
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
                    <span>
                      {formatCurrency(
                        cart?.subtotalAmount ?? 0,
                        cart?.currency ?? "USD",
                      )}
                    </span>
                  </div>

                  {updateItem.isError && (
                    <Alert className="mt-4" status="danger">
                      <Alert.Content>
                        <Alert.Title>We could not update your cart</Alert.Title>
                        <Alert.Description>
                          {getErrorMessage(updateItem.error)}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert>
                  )}
                </>
              )}
            </Modal.Body>

            {lines.length > 0 && (
              <Modal.Footer>
                <Link
                  className="w-full"
                  href={`/${merchant.slug}/cart`}
                  onClick={state.close}
                >
                  <Button
                    className="h-12 w-full text-sm font-bold text-white"
                    style={{
                      backgroundColor: config.colors.primary,
                      borderRadius: radiusValue(config.layout.borderRadius),
                    }}
                    type="button"
                    variant="primary"
                  >
                    Checkout
                  </Button>
                </Link>
              </Modal.Footer>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function CartModalRow({
  currency,
  isPending,
  line,
  onQuantityChange,
}: {
  currency: string;
  isPending: boolean;
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
}) {
  // The cart schema marks the line id optional; without one the API gives us no
  // way to address this line, so its controls stay disabled rather than failing.
  const canEdit = Boolean(line.id) && !isPending;

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold">{line.name}</p>
        <p className="mt-0.5 text-xs text-default-500">{line.sku}</p>
        <p className="mt-1 text-sm font-semibold">
          {formatCurrency(line.totalPrice, currency)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          aria-label={`Remove ${line.name} from cart`}
          className="text-default-400 transition-colors hover:text-danger disabled:opacity-40"
          disabled={!canEdit}
          type="button"
          onClick={() => onQuantityChange(0)}
        >
          <Icon icon="solar:trash-bin-minimalistic-outline" className="size-4" />
        </button>

        <div className="flex items-center gap-1">
          <button
            aria-label="Decrease quantity"
            className="grid size-6 place-items-center rounded-full border border-default-200 disabled:opacity-40"
            disabled={!canEdit || line.quantity <= 1}
            type="button"
            onClick={() => onQuantityChange(line.quantity - 1)}
          >
            <Icon icon="gravity-ui:minus" className="size-3" />
          </button>
          <span className="w-4 text-center text-xs font-medium">
            {line.quantity}
          </span>
          <button
            aria-label="Increase quantity"
            className="grid size-6 place-items-center rounded-full border border-default-200 disabled:opacity-40"
            disabled={!canEdit}
            type="button"
            onClick={() => onQuantityChange(line.quantity + 1)}
          >
            <Icon icon="gravity-ui:plus" className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
