"use client";

import { useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addCartItem,
  assignCartAddress,
  checkoutCart,
  createCartAddress,
  deleteCartAddress,
  ensureCart,
  ensureCartContact,
  getCart,
  getCartAddresses,
  getCartDeliveryOptions,
  removeCartItem,
  selectCartDelivery,
  updateCartAddress,
  updateCartContact,
  updateCartItem,
} from "@/lib/cart/cart-data";
import { cartSession } from "@/lib/cart/cart-session";
import type { AddressValues, Cart } from "@/types/cart";

export function cartQueryKey(merchantSlug: string, cartId?: string) {
  return ["storefront", "cart", merchantSlug, cartId ?? "none"] as const;
}

export function cartAddressesQueryKey(merchantSlug: string, cartId?: string) {
  return [
    "storefront",
    "cart-addresses",
    merchantSlug,
    cartId ?? "none",
  ] as const;
}

export function deliveryOptionsQueryKey(
  merchantSlug: string,
  cartId?: string,
  addressKey?: string,
) {
  return [
    "storefront",
    "delivery-options",
    merchantSlug,
    cartId ?? "none",
    // The API re-quotes against the cart's shipping address, so the options are
    // only cacheable for as long as that address stays put.
    addressKey ?? "no-address",
  ] as const;
}

export function useCartSession(merchantSlug: string) {
  return useSyncExternalStore(
    cartSession.subscribe,
    () => cartSession.getSnapshot(merchantSlug),
    cartSession.getServerSnapshot,
  );
}

export function useCart(merchantSlug: string) {
  const session = useCartSession(merchantSlug);
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => getCart(merchantSlug, session!),
    queryKey: cartQueryKey(merchantSlug, session?.cartId),
    retry: false,
  });

  // A cart that was converted at checkout, abandoned or expired is history:
  // callers want the live cart or nothing, so its lines never resurface.
  const cart = query.data?.status === "ACTIVE" ? query.data : null;
  const itemCount = cart
    ? cart.items.reduce((total, line) => total + line.quantity, 0)
    : 0;
  // A query that is disabled for want of a cart session stays `pending`
  // forever, which is not the same thing as loading — `isLoading` is pending
  // *and* fetching, so a shopper with no cart yet sees the empty state.
  const isLoading = Boolean(session) && query.isLoading;

  return { cart, isLoading, itemCount, query, session };
}

export function useAddToCart(merchantSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: {
      productId: string;
      quantity: number;
      variantId?: string;
    }) => addCartItem(merchantSlug, item),
    onSuccess: (cart) => writeCart(queryClient, merchantSlug, cart),
  });
}

export function useUpdateCartItem(merchantSlug: string) {
  const queryClient = useQueryClient();
  const session = useCartSession(merchantSlug);

  return useMutation({
    mutationFn: ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      if (!session) throw new Error("No cart to update");

      return quantity <= 0
        ? removeCartItem(merchantSlug, session, itemId)
        : updateCartItem(merchantSlug, session, itemId, quantity);
    },
    onSuccess: (cart) => writeCart(queryClient, merchantSlug, cart),
  });
}

export function useUpdateCartContact(merchantSlug: string) {
  const queryClient = useQueryClient();
  const session = useCartSession(merchantSlug);

  return useMutation({
    mutationFn: (contact: {
      customerEmail?: string;
      customerName?: string;
      customerPhone?: string;
      note?: string;
    }) => {
      if (!session) throw new Error("No cart to update");

      return updateCartContact(merchantSlug, session, contact);
    },
    onSuccess: (cart) => writeCart(queryClient, merchantSlug, cart),
  });
}

export function useCartAddresses(merchantSlug: string, enabled = true) {
  const session = useCartSession(merchantSlug);

  return useQuery({
    enabled: enabled && Boolean(session),
    queryFn: () => getCartAddresses(merchantSlug, session!),
    queryKey: cartAddressesQueryKey(merchantSlug, session?.cartId),
  });
}

export function useSaveCartAddress(merchantSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      values,
    }: {
      addressId?: string;
      values: AddressValues;
    }) => {
      // Saving an address is the first thing a shopper may do, so the cart it
      // hangs off might not exist yet — and the API will not take an address
      // until that cart carries contact details.
      const session = await ensureCart(merchantSlug);
      await ensureCartContact(merchantSlug, session, values);

      return addressId
        ? updateCartAddress(merchantSlug, session, addressId, values)
        : createCartAddress(merchantSlug, session, values);
    },
    onSuccess: () => invalidateCart(queryClient, merchantSlug),
  });
}

export function useDeleteCartAddress(merchantSlug: string) {
  const queryClient = useQueryClient();
  const session = useCartSession(merchantSlug);

  return useMutation({
    mutationFn: (addressId: string) => {
      if (!session) throw new Error("No cart to update");

      return deleteCartAddress(merchantSlug, session, addressId);
    },
    onSuccess: () => invalidateCart(queryClient, merchantSlug),
  });
}

export function useAssignCartAddress(merchantSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      type = "SHIPPING",
    }: {
      addressId: string;
      type?: "SHIPPING" | "BILLING";
    }) => {
      const session = await ensureCart(merchantSlug);

      return assignCartAddress(merchantSlug, session, addressId, type);
    },
    onSuccess: (cart) => {
      writeCart(queryClient, merchantSlug, cart);
      // A new destination re-prices every delivery option.
      queryClient.invalidateQueries({
        queryKey: ["storefront", "delivery-options", merchantSlug],
      });
    },
  });
}

export function useDeliveryOptions(merchantSlug: string, enabled = true) {
  const { cart, session } = useCart(merchantSlug);
  const addressKey = cart?.shippingAddress
    ? [
        cart.shippingAddress.country,
        cart.shippingAddress.province,
        cart.shippingAddress.city,
        cart.shippingAddress.postalCode,
      ].join("|")
    : undefined;

  return useQuery({
    enabled: enabled && Boolean(session),
    queryFn: () => getCartDeliveryOptions(merchantSlug, session!),
    queryKey: deliveryOptionsQueryKey(merchantSlug, session?.cartId, addressKey),
  });
}

export function useSelectDelivery(merchantSlug: string) {
  const queryClient = useQueryClient();
  const session = useCartSession(merchantSlug);

  return useMutation({
    mutationFn: (deliveryMethodId: string) => {
      if (!session) throw new Error("No cart to update");

      return selectCartDelivery(merchantSlug, session, deliveryMethodId);
    },
    onSuccess: (cart) => writeCart(queryClient, merchantSlug, cart),
  });
}

export function useCheckoutCart(merchantSlug: string) {
  const session = useCartSession(merchantSlug);

  return useMutation({
    mutationFn: () => {
      if (!session) throw new Error("No cart to check out");

      return checkoutCart(merchantSlug, session);
    },
  });
}

function writeCart(
  queryClient: ReturnType<typeof useQueryClient>,
  merchantSlug: string,
  cart: Cart,
) {
  queryClient.setQueryData(cartQueryKey(merchantSlug, cart.id), cart);
}

function invalidateCart(
  queryClient: ReturnType<typeof useQueryClient>,
  merchantSlug: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["storefront", "cart", merchantSlug],
    }),
    queryClient.invalidateQueries({
      queryKey: ["storefront", "cart-addresses", merchantSlug],
    }),
  ]);
}
