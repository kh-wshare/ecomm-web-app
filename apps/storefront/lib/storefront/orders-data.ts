import { createBrowserApiClient } from "@repo/api-client";
import type { ApiResponse, Order, OrderPage, OrderStatus } from "@repo/types";

import { env } from "@/lib/env";

const apiClient = createBrowserApiClient({ env });

export async function getCustomerOrders(
  merchantSlug: string,
  {
    customerEmail,
    status,
    page = 1,
    limit = 20,
  }: {
    customerEmail: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
  },
): Promise<OrderPage> {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    customerEmail,
    ...(status ? { status } : {}),
  });

  const response = await apiClient.get<ApiResponse<Order[]>>(
    `/storefront/${merchantSlug}/orders?${searchParams.toString()}`,
  );

  return {
    items: response.data,
    meta: response.meta ?? {
      limit,
      page,
      total: response.data.length,
      totalPages: response.data.length ? 1 : 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export async function getCustomerOrder(
  merchantSlug: string,
  orderNumber: string,
  customerEmail: string,
): Promise<Order> {
  const searchParams = new URLSearchParams({ customerEmail });

  const response = await apiClient.get<ApiResponse<Order>>(
    `/storefront/${merchantSlug}/orders/${orderNumber}?${searchParams.toString()}`,
  );

  return response.data;
}
