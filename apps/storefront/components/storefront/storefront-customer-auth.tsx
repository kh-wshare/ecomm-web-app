"use client";

import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCustomerAuthModal } from "@/components/storefront/customer-auth-modal";
import {
  customerSessionQueryKey,
  getCustomerSession,
} from "@/lib/storefront/customer-session";

const buttonClassName =
  "group flex size-11 items-center justify-center rounded-full border transition-[background-color,border-color,color] duration-200 ease-out";

const iconClassName =
  "size-5 transition-transform duration-200 ease-out group-hover:scale-110";

export function StorefrontCustomerAuth({ slug }: { slug: string }) {
  const { openLogin } = useCustomerAuthModal();
  const pathname = usePathname();
  const isActive = Boolean(pathname?.startsWith(`/${slug}/profile`));

  const customerQuery = useQuery({
    queryKey: customerSessionQueryKey,
    queryFn: getCustomerSession,
  });

  const customer = customerQuery.data;

  const style = isActive
    ? {
        backgroundColor:
          "color-mix(in srgb, var(--store-accent) 14%, transparent)",
        borderColor:
          "color-mix(in srgb, var(--store-accent) 32%, transparent)",
        color: "var(--store-accent)",
      }
    : {
        backgroundColor: "transparent",
        borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
      };

  if (customer) {
    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        aria-label={`Your profile, signed in as ${customer.user.fullName}`}
        className={buttonClassName}
        href={`/${slug}/profile`}
        style={style}
      >
        <Icon
          className={iconClassName}
          icon={isActive ? "solar:user-bold" : "solar:user-linear"}
        />
      </Link>
    );
  }

  return (
    <button
      aria-label="Sign in to your account"
      className={buttonClassName}
      style={style}
      type="button"
      onClick={openLogin}
    >
      <Icon className={iconClassName} icon="solar:user-linear" />
    </button>
  );
}
