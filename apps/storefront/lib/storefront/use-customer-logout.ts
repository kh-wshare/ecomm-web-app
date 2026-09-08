"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  customerSessionQueryKey,
  logoutCustomerSession,
} from "@/lib/storefront/customer-session";

export function useCustomerLogout(merchantSlug: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutCustomerSession,
    onSuccess: () => {
      queryClient.setQueryData(customerSessionQueryKey, null);
      router.push(`/${merchantSlug}`);
      router.refresh();
    },
  });
}
