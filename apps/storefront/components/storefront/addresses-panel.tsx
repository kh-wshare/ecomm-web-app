"use client";

import { Icon } from "@iconify/react";
import { Button, Card, Chip, Separator } from "@heroui/react";

import { EmptyState } from "@/components/storefront/empty-state";

export interface AddressData {
    id: string;
    label: string; // "Home", "Office", etc.
    recipientName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    isDefault?: boolean;
}

export function AddressesPanel({
    addresses = [],
    onAddAddress,
    onEditAddress,
    onDeleteAddress,
}: {
    addresses?: AddressData[];
    onAddAddress?: () => void;
    onEditAddress?: (id: string) => void;
    onDeleteAddress?: (id: string) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end">
                <Button size="sm" variant="primary" onPress={onAddAddress}>
                    <Icon icon="solar:add-circle-outline" className="text-base" />
                    Add address
                </Button>
            </div>

            {addresses.length === 0 ? (
                <EmptyState
                    icon="solar:map-point-outline"
                    title="No addresses saved"
                    description="Add a shipping address so you don't have to type it in every time."
                    actionLabel="Add an address"
                    onAction={onAddAddress}
                />
            ) : (
                addresses.map((address) => (
                    <Card.Root key={address.id} className="border border-default-200">
                        <Card.Content className="py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">
                                        {address.label}
                                    </p>
                                    {address.isDefault && (
                                        <Chip size="sm" color="accent" variant="soft">
                                            <Chip.Label>Default</Chip.Label>
                                        </Chip>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="ghost"
                                        aria-label={`Edit ${address.label} address`}
                                        onPress={() => onEditAddress?.(address.id)}
                                    >
                                        <Icon icon="solar:pen-outline" className="text-base" />
                                    </Button>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="ghost"
                                        aria-label={`Delete ${address.label} address`}
                                        onPress={() => onDeleteAddress?.(address.id)}
                                    >
                                        <Icon icon="solar:trash-bin-minimalistic-outline" className="text-base text-danger" />
                                    </Button>
                                </div>
                            </div>

                            <Separator className="my-3" />

                            <div className="space-y-0.5 text-sm text-default-500">
                                <p className="font-medium text-foreground">{address.recipientName}</p>
                                <p>{address.line1}</p>
                                {address.line2 && <p>{address.line2}</p>}
                                <p>
                                    {address.city}, {address.state} {address.postalCode}
                                </p>
                                <p>{address.country}</p>
                                {address.phone && <p className="pt-1">{address.phone}</p>}
                            </div>
                        </Card.Content>
                    </Card.Root>
                ))
            )}
        </div>
    );
}
