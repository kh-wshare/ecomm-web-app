"use client";

import { Icon } from "@iconify/react";
import { Tabs } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import type { OrderStatus } from "@repo/types";

import { OrdersPanel } from "@/components/storefront/orders-panel";
import { getErrorMessage } from "@/lib/errors/api-error";
import { useHasMounted } from "@/hooks/use-has-mounted";
import {
    customerSessionQueryKey,
    getCustomerSession,
} from "@/lib/storefront/customer-session";
import { getCustomerOrders } from "@/lib/storefront/orders-data";

const CURRENT_STATUSES: OrderStatus[] = [
    "DRAFT",
    "PENDING_PAYMENT",
    "RESERVED",
    "PAID",
    "PROCESSING",
    "FULFILLED",
];
const PAST_STATUSES: OrderStatus[] = [
    "COMPLETED",
    "CANCELLED",
    "PAYMENT_FAILED",
    "EXPIRED",
    "REFUNDED",
];

export function OrdersTabs({ merchantSlug }: { merchantSlug: string }) {
    const hasMounted = useHasMounted();

    const customerQuery = useQuery({
        queryKey: customerSessionQueryKey,
        queryFn: getCustomerSession,
    });

    const customerEmail = customerQuery.data?.user.email;

    const ordersQuery = useQuery({
        queryKey: ["storefront", "orders", merchantSlug, customerEmail],
        queryFn: () => getCustomerOrders(merchantSlug, { customerEmail: customerEmail!, limit: 50 }),
        enabled: Boolean(customerEmail),
    });

    if (!hasMounted || customerQuery.isPending || (Boolean(customerEmail) && ordersQuery.isPending)) {
        return (
            <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-default-100" />
                ))}
            </div>
        );
    }

    if (!customerEmail) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default-200 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon icon="solar:user-circle-outline" className="text-2xl" />
                </div>
                <p className="text-sm font-medium text-foreground">Sign in to see your orders</p>
                <p className="max-w-xs text-sm text-default-500">
                    Once you&apos;re signed in, your order history will show up here.
                </p>
            </div>
        );
    }

    if (ordersQuery.isError) {
        return (
            <div className="rounded-2xl border border-danger/20 bg-danger-50 px-4 py-6 text-center text-sm text-danger">
                {getErrorMessage(ordersQuery.error)}
            </div>
        );
    }

    const orders = ordersQuery.data?.items ?? [];
    const currentOrders = orders.filter((order) => CURRENT_STATUSES.includes(order.status));
    const pastOrders = orders.filter((order) => PAST_STATUSES.includes(order.status));

    return (
        <Tabs className="w-full">
            <Tabs.ListContainer>
                <Tabs.List aria-label="Order history">
                    <Tabs.Tab id="current">
                        Current
                        {currentOrders.length > 0 && ` (${currentOrders.length})`}
                        <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="past">
                        Past
                        {pastOrders.length > 0 && ` (${pastOrders.length})`}
                        <Tabs.Indicator />
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs.ListContainer>

            <Tabs.Panel className="pt-4" id="current">
                <OrdersPanel
                    emptyDescription="Orders being processed or on their way to you will show up here."
                    emptyTitle="No current orders"
                    merchantSlug={merchantSlug}
                    orders={currentOrders}
                />
            </Tabs.Panel>

            <Tabs.Panel className="pt-4" id="past">
                <OrdersPanel
                    emptyDescription="Completed, cancelled, or refunded orders will show up here."
                    emptyTitle="No past orders"
                    merchantSlug={merchantSlug}
                    orders={pastOrders}
                />
            </Tabs.Panel>
        </Tabs>
    );
}
