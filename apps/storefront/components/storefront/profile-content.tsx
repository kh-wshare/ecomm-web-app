"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Avatar } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { useHasMounted } from "@/hooks/use-has-mounted";
import { useCustomerLogout } from "@/lib/storefront/use-customer-logout";
import {
    customerSessionQueryKey,
    getCustomerSession,
} from "@/lib/storefront/customer-session";

export interface ProfileMenuItem {
    key: string;
    label: string;
    description: string;
    icon: string;
    href: string;
}

interface ProfileContentProps {
    merchantSlug: string;
}

function menuItems(merchantSlug: string): ProfileMenuItem[] {
    return [
        {
            key: "address",
            label: "Address",
            description: "Manage your delivery addresses",
            icon: "solar:map-point-outline",
            href: `/${merchantSlug}/profile/addresses`,
        },
        {
            key: "language",
            label: "Language",
            description: "Choose your preferred language",
            icon: "solar:global-outline",
            href: `/${merchantSlug}/profile/language`,
        },
        {
            key: "news",
            label: "News",
            description: "Stories and updates from this store",
            icon: "solar:document-text-outline",
            href: `/${merchantSlug}/posts`,
        },
        {
            key: "contacts",
            label: "Contacts",
            description: "Get in touch with the store",
            icon: "solar:letter-outline",
            href: `/${merchantSlug}/profile/contacts`,
        },
        {
            key: "settings",
            label: "Settings",
            description: "Security, privacy, and connected accounts",
            icon: "solar:settings-outline",
            href: `/${merchantSlug}/profile/settings`,
        },
    ];
}

export function ProfileContent({ merchantSlug }: ProfileContentProps) {
    const hasMounted = useHasMounted();
    const logout = useCustomerLogout(merchantSlug);

    const customerQuery = useQuery({
        queryKey: customerSessionQueryKey,
        queryFn: getCustomerSession,
    });

    if (!hasMounted || customerQuery.isPending) {
        return (
            <div className="mx-auto w-full max-w-2xl pb-4">
                <div className="h-20 animate-pulse rounded-3xl bg-default-100" />
                <div className="mt-6 h-64 animate-pulse rounded-3xl bg-default-100" />
            </div>
        );
    }

    const customer = customerQuery.data?.user;

    if (!customer) {
        return (
            <div className="mx-auto w-full max-w-2xl pb-4">
                <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-default-200 py-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <Icon icon="solar:user-circle-outline" className="text-2xl" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Sign in to view your profile</p>
                    <p className="max-w-xs text-sm text-default-500">
                        Tap the account icon to sign in — your profile, addresses, and orders will show up here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-2xl pb-4">
            {/* Header */}
            <Link
                className="flex items-center gap-4 rounded-3xl border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 active:scale-[0.99] dark:border-neutral-700 dark:hover:bg-neutral-800/50"
                href={`/${merchantSlug}/profile/edit`}
            >
                <Avatar size="md">
                    <Avatar.Image alt={customer.fullName} src="https://img.heroui.chat/image/avatar?w=400&h=400&u=3" />
                    <Avatar.Fallback>{customer.fullName}</Avatar.Fallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">
                        {customer.fullName}
                    </p>
                    <p className="truncate text-sm text-default-500">
                        {customer.email || customer.phone}
                    </p>
                </div>

                <Icon icon="solar:alt-arrow-right-linear" className="size-4 shrink-0 text-default-300" />
            </Link>

            {/* Menu listing */}
            <nav className="mt-6 flex flex-col gap-1 rounded-3xl border border-neutral-200 p-2 dark:border-neutral-700">
                {menuItems(merchantSlug).map((item) => (
                    <Link
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-neutral-50 active:scale-[0.99] dark:hover:bg-neutral-800/50"
                        href={item.href}
                        key={item.key}
                    >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                            <Icon icon={item.icon} className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-foreground">{item.label}</span>
                            <span className="block truncate text-xs text-default-500">{item.description}</span>
                        </span>
                        <Icon icon="solar:alt-arrow-right-linear" className="size-4 shrink-0 text-default-300" />
                    </Link>
                ))}
            </nav>

            {/* Logout */}
            <button
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/20 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/5 active:scale-[0.99] disabled:opacity-60"
                disabled={logout.isPending}
                type="button"
                onClick={() => logout.mutate()}
            >
                <Icon icon="solar:logout-3-outline" className="size-4" />
                {logout.isPending ? "Logging out..." : "Log out"}
            </button>
        </div>
    );
}
