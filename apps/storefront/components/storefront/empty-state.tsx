"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/react";

export function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
}: {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-default-200 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon icon={icon} className="text-2xl" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-sm text-default-500">{description}</p>
            </div>
            {actionLabel && actionHref && (
                <Link href={actionHref} className="w-full">
                    <Button size="sm" variant="primary" className="mt-1">
                        {actionLabel}
                    </Button>
                </Link>
            )}
            {actionLabel && onAction && !actionHref && (
                <Button type="button" size="sm" variant="primary" onPress={onAction} className="mt-1">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
