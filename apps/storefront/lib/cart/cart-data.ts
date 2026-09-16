import { createApiClient } from "@repo/api-client";
import type { ApiResponse, CreatedCheckoutSession } from "@repo/types";

import { cartSession, type CartSession } from "@/lib/cart/cart-session";
import { getCustomerSession } from "@/lib/storefront/customer-session";
import type {
  Address,
  AddressValues,
  Cart,
  CreatedCart,
  DeliveryOption,
  StorefrontAddress,
} from "@/types/cart";

// Cart calls go through the storefront's own origin rather than straight to
// the API: the X-Cart-Token header they carry is not in the API's CORS
// allowlist, so a browser preflight would block every one of them.
// See app/api/storefront/[...path]/route.ts.
const apiClient = createApiClient({ baseUrl: "/api" });

function cartPath(merchantSlug: string, cartId: string, suffix = "") {
  return `/storefront/${merchantSlug}/cart/${cartId}${suffix}`;
}

function withCartToken(cartToken: string) {
  return { headers: { "X-Cart-Token": cartToken } };
}

export async function createCart(
  merchantSlug: string,
  items: Array<{ productId: string; quantity: number; variantId?: string }> = [],
) {
  const response = await apiClient.post<
    ApiResponse<CreatedCart>,
    { items?: typeof items; sourceChannel: "WEBSITE" }
  >(`/storefront/${merchantSlug}/cart`, {
    sourceChannel: "WEBSITE",
    ...(items.length ? { items } : {}),
  });

  cartSession.set(merchantSlug, {
    cartId: response.data.id,
    cartToken: response.data.cartToken,
  });

  return response.data;
}

export async function getCart(merchantSlug: string, session: CartSession) {
  const response = await apiClient.get<ApiResponse<Cart>>(
    cartPath(merchantSlug, session.cartId),
    withCartToken(session.cartToken),
  );

  return response.data;
}

// A cart that was converted at checkout, abandoned or expired can no longer be
// added to, so the stale session is dropped and a fresh cart takes its place.
export async function ensureCart(merchantSlug: string): Promise<CartSession> {
  const existing = cartSession.get(merchantSlug);

  if (existing) {
    try {
      const cart = await getCart(merchantSlug, existing);
      if (cart.status === "ACTIVE") return existing;
    } catch {
      // Unknown or unauthorised cart — fall through and start a new one.
    }

    cartSession.clear(merchantSlug);
  }

  const created = await createCart(merchantSlug);

  return { cartId: created.id, cartToken: created.cartToken };
}

export async function addCartItem(
  merchantSlug: string,
  item: { productId: string; quantity: number; variantId?: string },
) {
  const session = await ensureCart(merchantSlug);
  const response = await apiClient.post<ApiResponse<Cart>, typeof item>(
    cartPath(merchantSlug, session.cartId, "/items"),
    item,
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function updateCartItem(
  merchantSlug: string,
  session: CartSession,
  itemId: string,
  quantity: number,
) {
  const response = await apiClient.patch<
    ApiResponse<Cart>,
    { quantity: number }
  >(
    cartPath(merchantSlug, session.cartId, `/items/${itemId}`),
    { quantity },
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function removeCartItem(
  merchantSlug: string,
  session: CartSession,
  itemId: string,
) {
  const response = await apiClient.delete<ApiResponse<Cart>>(
    cartPath(merchantSlug, session.cartId, `/items/${itemId}`),
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function clearCartItems(
  merchantSlug: string,
  session: CartSession,
) {
  const response = await apiClient.delete<ApiResponse<Cart>>(
    cartPath(merchantSlug, session.cartId, "/items"),
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function updateCartContact(
  merchantSlug: string,
  session: CartSession,
  contact: {
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    note?: string;
  },
) {
  const response = await apiClient.patch<ApiResponse<Cart>, typeof contact>(
    cartPath(merchantSlug, session.cartId, "/contact"),
    contact,
    withCartToken(session.cartToken),
  );

  return response.data;
}

// The API will not attach an address to a cart that does not yet know who the
// order is for — it wants a name plus an email or a phone number. The cart page
// asks for those up front, but an address saved from the profile has no such
// step, so the details are filled in from the signed-in shopper, or failing
// that from the address being saved.
export async function ensureCartContact(
  merchantSlug: string,
  session: CartSession,
  values: AddressValues,
) {
  const cart = await getCart(merchantSlug, session);

  if (cart.customerName && (cart.customerEmail || cart.customerPhone)) return;

  const customer = await getCustomerSession().catch(() => null);
  const name = customer?.user.fullName || values.recipientName.trim();
  const email = customer?.user.email || values.email.trim();
  const phone = customer?.user.phone || values.phone.trim();

  if (!name || (!email && !phone)) {
    throw new Error(
      "Add an email or a phone number to this address so the store can reach you about the order.",
    );
  }

  await updateCartContact(merchantSlug, session, {
    customerName: name,
    ...(email ? { customerEmail: email } : {}),
    ...(phone ? { customerPhone: phone } : {}),
  });
}

export async function getCartAddresses(
  merchantSlug: string,
  session: CartSession,
) {
  const response = await apiClient.get<ApiResponse<StorefrontAddress[]>>(
    cartPath(merchantSlug, session.cartId, "/addresses"),
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function createCartAddress(
  merchantSlug: string,
  session: CartSession,
  values: AddressValues,
) {
  const response = await apiClient.post<
    ApiResponse<StorefrontAddress>,
    ReturnType<typeof normalizeAddress>
  >(
    cartPath(merchantSlug, session.cartId, "/addresses"),
    normalizeAddress(values),
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function updateCartAddress(
  merchantSlug: string,
  session: CartSession,
  addressId: string,
  values: AddressValues,
) {
  const response = await apiClient.patch<
    ApiResponse<StorefrontAddress>,
    ReturnType<typeof normalizeAddress>
  >(
    cartPath(merchantSlug, session.cartId, `/addresses/${addressId}`),
    normalizeAddress(values),
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function deleteCartAddress(
  merchantSlug: string,
  session: CartSession,
  addressId: string,
) {
  await apiClient.delete<ApiResponse<unknown>>(
    cartPath(merchantSlug, session.cartId, `/addresses/${addressId}`),
    withCartToken(session.cartToken),
  );
}

export async function assignCartAddress(
  merchantSlug: string,
  session: CartSession,
  addressId: string,
  type: "SHIPPING" | "BILLING",
) {
  const response = await apiClient.patch<
    ApiResponse<Cart>,
    { type: "SHIPPING" | "BILLING" }
  >(
    cartPath(merchantSlug, session.cartId, `/addresses/${addressId}/assign`),
    { type },
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function getCartDeliveryOptions(
  merchantSlug: string,
  session: CartSession,
) {
  const response = await apiClient.get<ApiResponse<DeliveryOption[]>>(
    cartPath(merchantSlug, session.cartId, "/delivery-options"),
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function selectCartDelivery(
  merchantSlug: string,
  session: CartSession,
  deliveryMethodId: string,
) {
  const response = await apiClient.patch<
    ApiResponse<Cart>,
    { deliveryMethodId: string }
  >(
    cartPath(merchantSlug, session.cartId, "/delivery"),
    { deliveryMethodId },
    withCartToken(session.cartToken),
  );

  return response.data;
}

export async function checkoutCart(
  merchantSlug: string,
  session: CartSession,
  expiresInMinutes = 15,
) {
  const response = await apiClient.post<
    ApiResponse<CreatedCheckoutSession>,
    { expiresInMinutes: number }
  >(
    cartPath(merchantSlug, session.cartId, "/checkout"),
    { expiresInMinutes },
    withCartToken(session.cartToken),
  );

  return response.data;
}

function normalizeAddress(values: AddressValues) {
  return {
    label: optional(values.label),
    recipientName: values.recipientName.trim(),
    phone: optional(values.phone),
    email: optional(values.email),
    line1: values.line1.trim(),
    line2: optional(values.line2),
    city: optional(values.city),
    province: optional(values.province),
    postalCode: optional(values.postalCode),
    country: values.country.trim().toUpperCase(),
    note: optional(values.note),
    isDefaultShipping: values.isDefaultShipping,
  };
}

function optional(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

export type { Address, StorefrontAddress };
