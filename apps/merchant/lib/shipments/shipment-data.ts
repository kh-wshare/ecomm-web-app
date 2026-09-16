import type { ApiResponse } from "@repo/types";

import type {
  CreateShipmentValues,
  Shipment,
  ShipmentFilters,
  ShipmentPage,
  ShipmentStatusValues,
  UpdateShipmentValues,
} from "@/types/shipment";

const commerceBasePath = "/merchant/api/commerce";

export async function getShipments(
  filters: ShipmentFilters,
): Promise<ShipmentPage> {
  const response = await shipmentRequest<ApiResponse<Shipment[]>>(
    `/shipments?${new URLSearchParams({
      page: String(filters.page),
      limit: String(filters.limit),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(filters.orderId ? { orderId: filters.orderId } : {}),
    })}`,
  );

  return {
    items: response.data,
    meta: response.meta ?? emptyMeta(filters.page, filters.limit),
  };
}

export async function getShipment(shipmentId: string) {
  const response = await shipmentRequest<ApiResponse<Shipment>>(
    `/shipments/${shipmentId}`,
  );

  return response.data;
}

export async function getOrderShipments(orderId: string) {
  const response = await shipmentRequest<ApiResponse<Shipment[]>>(
    `/orders/${orderId}/shipments`,
  );

  return response.data;
}

export async function createShipment(
  orderId: string,
  values: CreateShipmentValues,
) {
  const response = await shipmentRequest<ApiResponse<Shipment>>(
    `/orders/${orderId}/shipments`,
    {
      body: {
        carrierName: optional(values.carrierName),
        trackingNumber: optional(values.trackingNumber),
        trackingUrl: optional(values.trackingUrl),
        note: optional(values.note),
        ...(values.items ? { items: values.items } : {}),
      },
      method: "POST",
    },
  );

  return response.data;
}

export async function updateShipment(
  shipmentId: string,
  values: UpdateShipmentValues,
) {
  const response = await shipmentRequest<ApiResponse<Shipment>>(
    `/shipments/${shipmentId}`,
    {
      body: {
        carrierName: optional(values.carrierName),
        trackingNumber: optional(values.trackingNumber),
        trackingUrl: optional(values.trackingUrl),
        note: optional(values.note),
      },
      method: "PATCH",
    },
  );

  return response.data;
}

export async function updateShipmentStatus(
  shipmentId: string,
  values: ShipmentStatusValues,
) {
  const response = await shipmentRequest<ApiResponse<Shipment>>(
    `/shipments/${shipmentId}/status`,
    {
      body: {
        status: values.status,
        message: optional(values.message),
        location: optional(values.location),
      },
      method: "PATCH",
    },
  );

  return response.data;
}

function optional(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function emptyMeta(page: number, limit: number) {
  return {
    limit,
    page,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: page > 1,
  };
}

async function shipmentRequest<T>(
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
        : "Shipment request failed";

    throw new Error(message);
  }

  return payload as T;
}
