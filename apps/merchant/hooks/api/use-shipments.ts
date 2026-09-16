"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@repo/query-client";

import {
  createShipment,
  getOrderShipments,
  getShipments,
  updateShipment,
  updateShipmentStatus,
} from "@/lib/shipments/shipment-data";
import type {
  CreateShipmentValues,
  ShipmentFilters,
  ShipmentStatusValues,
  UpdateShipmentValues,
} from "@/types/shipment";

export function useShipments(filters: ShipmentFilters, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getShipments(filters),
    queryKey: queryKeys.shipments.list(filters),
  });
}

export function useOrderShipments(orderId: string, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getOrderShipments(orderId),
    queryKey: queryKeys.shipments.forOrder(orderId),
  });
}

export function useCreateShipment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateShipmentValues) =>
      createShipment(orderId, values),
    onSuccess: () => invalidateShipmentAndOrder(queryClient, orderId),
  });
}

export function useUpdateShipment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shipmentId,
      values,
    }: {
      shipmentId: string;
      values: UpdateShipmentValues;
    }) => updateShipment(shipmentId, values),
    onSuccess: () => invalidateShipmentAndOrder(queryClient, orderId),
  });
}

export function useUpdateShipmentStatus(orderId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shipmentId,
      values,
    }: {
      shipmentId: string;
      values: ShipmentStatusValues;
    }) => updateShipmentStatus(shipmentId, values),
    onSuccess: () => invalidateShipmentAndOrder(queryClient, orderId),
  });
}

// Advancing a shipment rolls the parent order's fulfillment status up from all
// of its shipments, so the order caches are as stale as the shipment ones.
function invalidateShipmentAndOrder(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId?: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.merchant.dashboard() }),
    ...(orderId
      ? [
          queryClient.invalidateQueries({
            queryKey: queryKeys.orders.detail(orderId),
          }),
        ]
      : []),
  ]);
}
