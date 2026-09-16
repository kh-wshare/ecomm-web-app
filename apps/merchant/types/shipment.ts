import type { PaginationMeta } from "@repo/types";

export type ShipmentStatus =
  | "PENDING"
  | "READY_FOR_PICKUP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED"
  | "CANCELLED";

export type ShipmentItem = {
  id: string;
  orderItemId: string;
  quantity: number;
};

export type ShipmentEvent = {
  status: ShipmentStatus;
  message: string | null;
  location: string | null;
  occurredAt: string;
};

export type Shipment = {
  id: string;
  orderId: string;
  shipmentNumber: string;
  status: ShipmentStatus;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: ShipmentItem[];
  events: ShipmentEvent[];
};

export type ShipmentPage = {
  items: Shipment[];
  meta: PaginationMeta;
};

export type ShipmentFilters = {
  search: string;
  status: ShipmentStatus | "ALL";
  orderId: string;
  page: number;
  limit: number;
};

export type CreateShipmentValues = {
  carrierName: string;
  trackingNumber: string;
  trackingUrl: string;
  note: string;
  // Omitted entirely when every line is at its full remaining quantity, which
  // is the documented "ship everything not already covered" path.
  items?: Array<{ orderItemId: string; quantity: number }>;
};

export type UpdateShipmentValues = {
  carrierName: string;
  trackingNumber: string;
  trackingUrl: string;
  note: string;
};

export type ShipmentStatusValues = {
  status: ShipmentStatus;
  message: string;
  location: string;
};
