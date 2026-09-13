import { cache } from "react";
import { notFound } from "next/navigation";
import { ApiError, createServerApiClient } from "@repo/api-client";
import type {
  ApiResponse,
  PublicArticle,
  PublicProduct,
  PublicProductPage,
  PublicStorefront,
} from "@repo/types";

import { env } from "@/lib/env";

const apiClient = createServerApiClient({ env });

// A missing merchant/product is an expected, routine outcome (bad slug,
// unpublished store) — render the not-found UI instead of the error
// boundary. Any other status still propagates to error.tsx as a real failure.
async function withNotFound<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }
}

export const getPublicStorefront = cache(async (merchantSlug: string) => {
  const response = await withNotFound(
    apiClient.get<ApiResponse<PublicStorefront>>(`/storefront/${merchantSlug}`, {
      cache: "no-store",
    }),
  );

  return response.data;
});

export async function getPublicProducts(
  merchantSlug: string,
  limit = 6,
  page = 1,
): Promise<PublicProductPage> {
  const response = await withNotFound(
    apiClient.get<ApiResponse<PublicProduct[]>>(
      `/storefront/${merchantSlug}/products?page=${page}&limit=${limit}`,
      { cache: "no-store" },
    ),
  );

  return {
    items: response.data,
    meta: response.meta ?? {
      limit: limit,
      page: page,
      total: response.data.length,
      totalPages: response.data.length ? Math.ceil(response.data.length / limit) : 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export async function getPublicProduct(
  merchantSlug: string,
  productSlug: string,
) {
  const response = await withNotFound(
    apiClient.get<ApiResponse<PublicProduct>>(
      `/storefront/${merchantSlug}/products/${productSlug}`,
      { cache: "no-store" },
    ),
  );

  return response.data;
}

export async function getPublicArticles(merchantSlug: string) {
  const response = await withNotFound(
    apiClient.get<ApiResponse<PublicArticle[]>>(`/storefront/${merchantSlug}/posts`, {
      cache: "no-store",
    }),
  );

  return response.data;
}
