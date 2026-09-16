import type { Shipment, ShipmentStatus } from "@/types/shipment";

const tones: Record<ShipmentStatus, string> = {
  PENDING: "bg-surface-secondary text-muted",
  READY_FOR_PICKUP: "bg-warning/10 text-warning-foreground",
  IN_TRANSIT: "bg-warning/10 text-warning-foreground",
  OUT_FOR_DELIVERY: "bg-warning/10 text-warning-foreground",
  DELIVERED: "bg-success/10 text-success",
  FAILED: "bg-danger/10 text-danger",
  RETURNED: "bg-danger/10 text-danger",
  CANCELLED: "bg-danger/10 text-danger",
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${tones[status] ?? tones.PENDING}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function statusLabel(status: ShipmentStatus) {
  return status.replaceAll("_", " ");
}

const terminalStatuses: ShipmentStatus[] = [
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
];

export function isLive(shipment: Shipment) {
  return !terminalStatuses.includes(shipment.status);
}

// The API exposes no delivery-method type on a shipment, so the pickup and
// courier branches are not known up front — both are offered at PENDING, and
// the choice made there determines what comes next.
export function forwardStatuses(status: ShipmentStatus): ShipmentStatus[] {
  switch (status) {
    case "PENDING":
      return ["READY_FOR_PICKUP", "IN_TRANSIT"];
    case "READY_FOR_PICKUP":
      return ["DELIVERED"];
    case "IN_TRANSIT":
      return ["OUT_FOR_DELIVERY", "DELIVERED"];
    case "OUT_FOR_DELIVERY":
      return ["DELIVERED"];
    case "FAILED":
      return ["IN_TRANSIT", "RETURNED"];
    default:
      return [];
  }
}

export function haltStatuses(status: ShipmentStatus): ShipmentStatus[] {
  if (terminalStatuses.includes(status) || status === "FAILED") return [];

  return ["FAILED", "CANCELLED"];
}

// A line is only covered by shipments that still exist: a cancelled shipment
// releases its units back for reshipping.
export function shippedQuantity(shipments: Shipment[], orderItemId: string) {
  return shipments
    .filter((shipment) => shipment.status !== "CANCELLED")
    .flatMap((shipment) => shipment.items)
    .filter((item) => item.orderItemId === orderItemId)
    .reduce((total, item) => total + item.quantity, 0);
}
