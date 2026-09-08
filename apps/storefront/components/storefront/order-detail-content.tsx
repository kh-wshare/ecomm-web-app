"use client";

import { Icon } from "@iconify/react";
import { Chip } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { ORDER_STATUS_CONFIG } from "@/components/storefront/orders-panel";
import { formatCurrency } from "@/lib/formatters/currency";
import { getErrorMessage } from "@/lib/errors/api-error";
import { useHasMounted } from "@/hooks/use-has-mounted";
import {
    customerSessionQueryKey,
    getCustomerSession,
} from "@/lib/storefront/customer-session";
import { getCustomerOrder } from "@/lib/storefront/orders-data";

function formatOrderDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function OrderDetailContent({
    merchantSlug,
    orderNumber,
}: {
    merchantSlug: string;
    orderNumber: string;
}) {
    const hasMounted = useHasMounted();

    const customerQuery = useQuery({
        queryKey: customerSessionQueryKey,
        queryFn: getCustomerSession,
    });

    const customerEmail = customerQuery.data?.user.email;

    const orderQuery = useQuery({
        queryKey: ["storefront", "order", merchantSlug, orderNumber, customerEmail],
        queryFn: () => getCustomerOrder(merchantSlug, orderNumber, customerEmail!),
        enabled: Boolean(customerEmail),
        retry: false,
    });

    if (!hasMounted || customerQuery.isPending || (Boolean(customerEmail) && orderQuery.isPending)) {
        return (
            <div className="flex flex-col gap-3 pb-10 pt-6">
                <div className="h-24 animate-pulse rounded-2xl bg-default-100" />
                <div className="h-40 animate-pulse rounded-2xl bg-default-100" />
            </div>
        );
    }

    if (!customerEmail) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default-200 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon icon="solar:user-circle-outline" className="text-2xl" />
                </div>
                <p className="text-sm font-medium text-foreground">Sign in to view this order</p>
            </div>
        );
    }

    if (orderQuery.isError) {
        return (
            <div className="rounded-2xl border border-danger/20 bg-danger-50 px-4 py-6 text-center text-sm text-danger">
                {getErrorMessage(orderQuery.error)}
            </div>
        );
    }

    const order = orderQuery.data;
    if (!order) return null;

    const status = ORDER_STATUS_CONFIG[order.status];

    return (
        <div className="flex flex-col gap-5 pb-10 pt-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-lg font-semibold text-foreground">Order #{order.orderNumber}</p>
                    <p className="mt-1 text-sm text-default-500">Placed {formatOrderDate(order.createdAt)}</p>
                </div>
                <Chip size="sm" color={status.color} variant="soft">
                    <Icon icon={status.icon} className="text-sm" />
                    <Chip.Label>{status.label}</Chip.Label>
                </Chip>
            </div>

            <div className="overflow-hidden rounded-2xl border border-default-200">
                <div className="border-b border-default-200 px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Items</p>
                </div>
                <div className="divide-y divide-default-100">
                    {order.items.map((item) => (
                        <div className="flex items-center justify-between gap-4 px-4 py-3" key={item.id}>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                <p className="mt-0.5 text-xs text-default-500">
                                    {item.sku} · Qty {item.quantity}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold text-foreground">
                                    {formatCurrency(item.totalPrice, order.currency)}
                                </p>
                                <p className="mt-0.5 text-xs text-default-500">
                                    {formatCurrency(item.unitPrice, order.currency)} each
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-default-200 p-4">
                <p className="text-sm font-semibold text-foreground">Summary</p>
                <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <dt className="text-default-500">Subtotal</dt>
                        <dd>{formatCurrency(order.subtotalAmount, order.currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-default-500">Discount</dt>
                        <dd>−{formatCurrency(order.discountAmount, order.currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-default-500">Fees</dt>
                        <dd>{formatCurrency(order.feeAmount, order.currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-default-200 pt-2 text-base font-semibold text-foreground">
                        <dt>Total</dt>
                        <dd>{formatCurrency(order.totalAmount, order.currency)}</dd>
                    </div>
                </dl>
            </div>

            {order.payment && (
                <div className="rounded-2xl border border-default-200 p-4">
                    <p className="text-sm font-semibold text-foreground">Payment</p>
                    <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <dt className="text-default-500">Method</dt>
                            <dd>{order.payment.provider}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-default-500">Status</dt>
                            <dd>{order.payment.status}</dd>
                        </div>
                        {order.payment.paidAt && (
                            <div className="flex items-center justify-between">
                                <dt className="text-default-500">Paid</dt>
                                <dd>{formatOrderDate(order.payment.paidAt)}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            )}
        </div>
    );
}
