"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Card, Chip } from "@heroui/react";
import type { Order, OrderStatus } from "@repo/types";

import { EmptyState } from "@/components/storefront/empty-state";
import { formatCurrency } from "@/lib/formatters/currency";

export const ORDER_STATUS_CONFIG: Record<
    OrderStatus,
    { label: string; color: "default" | "accent" | "success" | "warning" | "danger"; icon: string }
> = {
    DRAFT: { label: "Draft", color: "default", icon: "solar:document-outline" },
    PENDING_PAYMENT: { label: "Pending payment", color: "warning", icon: "solar:clock-circle-outline" },
    RESERVED: { label: "Reserved", color: "warning", icon: "solar:bookmark-outline" },
    PAID: { label: "Paid", color: "accent", icon: "solar:wallet-money-outline" },
    PROCESSING: { label: "Processing", color: "accent", icon: "solar:refresh-circle-outline" },
    FULFILLED: { label: "Fulfilled", color: "accent", icon: "solar:delivery-outline" },
    COMPLETED: { label: "Completed", color: "success", icon: "solar:check-circle-outline" },
    CANCELLED: { label: "Cancelled", color: "danger", icon: "solar:close-circle-outline" },
    PAYMENT_FAILED: { label: "Payment failed", color: "danger", icon: "solar:danger-triangle-outline" },
    EXPIRED: { label: "Expired", color: "danger", icon: "solar:hourglass-outline" },
    REFUNDED: { label: "Refunded", color: "default", icon: "solar:card-recive-outline" },
};

function formatOrderDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function OrdersPanel({
    merchantSlug,
    orders = [],
    emptyTitle = "No orders yet",
    emptyDescription = "Orders you place will show up here so you can track them anytime.",
}: {
    merchantSlug: string;
    orders?: Order[];
    emptyTitle?: string;
    emptyDescription?: string;
}) {
    if (orders.length === 0) {
        return (
            <EmptyState
                icon="solar:bag-4-outline"
                title={emptyTitle}
                description={emptyDescription}
                actionLabel="Start shopping"
                actionHref={`/${merchantSlug}`}
            />
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {orders.map((order) => {
                const status = ORDER_STATUS_CONFIG[order.status];
                const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

                return (
                    <Link href={`/${merchantSlug}/orders/${order.orderNumber}`} key={order.id}>
                        <Card.Root className="group border border-default-200 transition-colors hover:border-accent/40 hover:bg-accent/5">
                            <Card.Content className="flex items-center gap-4 py-4">
                                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-default-100 text-default-400">
                                    <Icon icon="solar:box-minimalistic-outline" className="text-xl" />
                                </div>

                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            Order #{order.orderNumber}
                                        </p>
                                        <p className="shrink-0 text-sm font-semibold text-foreground">
                                            {formatCurrency(order.totalAmount, order.currency)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-default-500">
                                        <span>{formatOrderDate(order.createdAt)}</span>
                                        <span aria-hidden>•</span>
                                        <span>
                                            {itemCount} {itemCount === 1 ? "item" : "items"}
                                        </span>
                                    </div>
                                    <Chip size="sm" color={status.color} variant="soft" className="mt-1">
                                        <Icon icon={status.icon} className="text-sm" />
                                        <Chip.Label>{status.label}</Chip.Label>
                                    </Chip>
                                </div>

                                <Icon
                                    icon="solar:alt-arrow-right-linear"
                                    className="shrink-0 text-lg text-default-300 transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                                />
                            </Card.Content>
                        </Card.Root>
                    </Link>
                );
            })}
        </div>
    );
}
