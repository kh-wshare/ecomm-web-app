import type { ApiResponse } from "@repo/types";

import type {
  DeliveryMethod,
  DeliveryMethodFilters,
  DeliveryMethodValues,
  DeliveryZone,
  DeliveryZoneValues,
} from "@/types/delivery";

const commerceBasePath = "/merchant/api/commerce";

export async function getDeliveryMethods(
  filters: DeliveryMethodFilters = {},
) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  const suffix = params.size ? `?${params.toString()}` : "";
  const response = await deliveryRequest<ApiResponse<DeliveryMethod[]>>(
    `/delivery-methods${suffix}`,
  );

  return response.data;
}

export async function createDeliveryMethod(values: DeliveryMethodValues) {
  const response = await deliveryRequest<ApiResponse<DeliveryMethod>>(
    "/delivery-methods",
    {
      body: normalizeMethod(values),
      method: "POST",
    },
  );

  return response.data;
}

export async function updateDeliveryMethod(
  deliveryMethodId: string,
  values: DeliveryMethodValues,
) {
  const response = await deliveryRequest<ApiResponse<DeliveryMethod>>(
    `/delivery-methods/${deliveryMethodId}`,
    {
      body: normalizeMethod(values),
      method: "PATCH",
    },
  );

  return response.data;
}

export async function archiveDeliveryMethod(deliveryMethodId: string) {
  const response = await deliveryRequest<ApiResponse<DeliveryMethod>>(
    `/delivery-methods/${deliveryMethodId}`,
    { method: "DELETE" },
  );

  return response.data;
}

export async function createDeliveryZone(
  deliveryMethodId: string,
  values: DeliveryZoneValues,
) {
  const response = await deliveryRequest<ApiResponse<DeliveryZone>>(
    `/delivery-methods/${deliveryMethodId}/zones`,
    {
      body: normalizeZone(values),
      method: "POST",
    },
  );

  return response.data;
}

export async function updateDeliveryZone(
  deliveryMethodId: string,
  zoneId: string,
  values: DeliveryZoneValues,
) {
  const response = await deliveryRequest<ApiResponse<DeliveryZone>>(
    `/delivery-methods/${deliveryMethodId}/zones/${zoneId}`,
    {
      body: normalizeZone(values),
      method: "PATCH",
    },
  );

  return response.data;
}

export async function archiveDeliveryZone(
  deliveryMethodId: string,
  zoneId: string,
) {
  const response = await deliveryRequest<ApiResponse<DeliveryZone>>(
    `/delivery-methods/${deliveryMethodId}/zones/${zoneId}`,
    { method: "DELETE" },
  );

  return response.data;
}

function normalizeMethod(values: DeliveryMethodValues) {
  const isPickup = values.type === "PICKUP";

  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    description: optional(values.description),
    type: values.type,
    // The API documents branchId as meaningful only for PICKUP, so a stale
    // branch left behind by a type switch is dropped rather than sent.
    branchId: isPickup ? optional(values.branchId) : undefined,
    status: values.status,
    isDefault: values.isDefault,
    sortOrder: values.sortOrder,
  };
}

function normalizeZone(values: DeliveryZoneValues) {
  return {
    name: values.name.trim(),
    countries: toList(values.countries).map((entry) => entry.toUpperCase()),
    provinces: toList(values.provinces),
    cities: toList(values.cities),
    postalCodes: toList(values.postalCodes),
    baseFee: toMoney(values.baseFee) ?? "0.00",
    perItemFee: toMoney(values.perItemFee) ?? "0.00",
    freeOverSubtotal: toMoney(values.freeOverSubtotal),
    minSubtotal: toMoney(values.minSubtotal),
    maxSubtotal: toMoney(values.maxSubtotal),
    estimatedMinDays: toCount(values.estimatedMinDays),
    estimatedMaxDays: toCount(values.estimatedMaxDays),
    isFallback: values.isFallback,
    sortOrder: toCount(values.sortOrder) ?? 0,
  };
}

// An empty match list means "matches anything", so a blank field has to reach
// the API as [], never as [""].
export function toList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toMoney(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const amount = Number(trimmed);

  return Number.isFinite(amount) ? amount.toFixed(2) : undefined;
}

function toCount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const count = Number(trimmed);

  return Number.isInteger(count) && count >= 0 ? count : undefined;
}

function optional(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

async function deliveryRequest<T>(
  path: string,
  options: { body?: unknown; method?: string } = {},
) {
  const response = await fetch(`${commerceBasePath}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
    },
    method: options.method ?? "GET",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : "Delivery request failed";

    throw new Error(message);
  }

  return payload as T;
}
