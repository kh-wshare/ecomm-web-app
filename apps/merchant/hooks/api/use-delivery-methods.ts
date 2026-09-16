"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@repo/query-client";

import {
  archiveDeliveryMethod,
  archiveDeliveryZone,
  createDeliveryMethod,
  createDeliveryZone,
  getDeliveryMethods,
  updateDeliveryMethod,
  updateDeliveryZone,
} from "@/lib/delivery/delivery-data";
import type {
  DeliveryMethodFilters,
  DeliveryMethodValues,
  DeliveryZoneValues,
} from "@/types/delivery";

export function useDeliveryMethods(
  filters: DeliveryMethodFilters = {},
  enabled = true,
) {
  return useQuery({
    enabled,
    queryFn: () => getDeliveryMethods(filters),
    queryKey: queryKeys.deliveryMethods.list(filters),
  });
}

export function useSaveDeliveryMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryMethodId,
      values,
    }: {
      deliveryMethodId?: string;
      values: DeliveryMethodValues;
    }) =>
      deliveryMethodId
        ? updateDeliveryMethod(deliveryMethodId, values)
        : createDeliveryMethod(values),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.deliveryMethods.all,
      }),
  });
}

export function useArchiveDeliveryMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveDeliveryMethod,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.deliveryMethods.all,
      }),
  });
}

export function useSaveDeliveryZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryMethodId,
      values,
      zoneId,
    }: {
      deliveryMethodId: string;
      values: DeliveryZoneValues;
      zoneId?: string;
    }) =>
      zoneId
        ? updateDeliveryZone(deliveryMethodId, zoneId, values)
        : createDeliveryZone(deliveryMethodId, values),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.deliveryMethods.all,
      }),
  });
}

export function useArchiveDeliveryZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryMethodId,
      zoneId,
    }: {
      deliveryMethodId: string;
      zoneId: string;
    }) => archiveDeliveryZone(deliveryMethodId, zoneId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.deliveryMethods.all,
      }),
  });
}
