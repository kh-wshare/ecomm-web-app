"use client";

import { Avatar } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import Link from "next/link";

import { useCustomerAuthModal } from "@/components/storefront/customer-auth-modal";
import {
  customerSessionQueryKey,
  getCustomerSession,
} from "@/lib/storefront/customer-session";

export function StorefrontCustomerAuth({ slug }: { slug: string }) {
  const { openLogin } = useCustomerAuthModal();

  const customerQuery = useQuery({
    queryKey: customerSessionQueryKey,
    queryFn: getCustomerSession,
  });

  const customer = customerQuery.data;

  /**
   * Logged in
   */
  if (customer) {
    const initials = getInitials(customer.user.fullName);

    return (
      <Link href={`/${slug}/profile`}>
        <Avatar size="md">
          <Avatar.Image
            alt="Blue"
            src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
          />

          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
      </Link>
    );
  }

  /**
   * Logged out
   */
  return (
    <Avatar size="md" onClick={openLogin}>
      <Avatar.Fallback>
        <Icon
          icon="solar:user-broken"
          className="size-6 transition-transform duration-200 group-hover:scale-110"
        />
      </Avatar.Fallback>
    </Avatar>
  );
}

function getInitials(name?: string) {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
