"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Alert, Button, Card, Chip, Separator } from "@heroui/react";

import { AddressFormModal } from "@/components/storefront/address-form-modal";
import { EmptyState } from "@/components/storefront/empty-state";
import { getErrorMessage } from "@/lib/errors/api-error";
import {
  useCartAddresses,
  useDeleteCartAddress,
  useSaveCartAddress,
} from "@/lib/cart/use-cart";
import { formatAddress, type StorefrontAddress } from "@/types/cart";

export function AddressesPanel({ merchantSlug }: { merchantSlug: string }) {
    const addressesQuery = useCartAddresses(merchantSlug);
    const saveAddress = useSaveCartAddress(merchantSlug);
    const deleteAddress = useDeleteCartAddress(merchantSlug);

    const [editing, setEditing] = useState<StorefrontAddress | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const addresses = addressesQuery.data ?? [];

    const openCreate = () => {
        setEditing(null);
        setIsFormOpen(true);
    };
    const openEdit = (address: StorefrontAddress) => {
        setEditing(address);
        setIsFormOpen(true);
    };
    const closeForm = () => {
        if (saveAddress.isPending) return;
        setIsFormOpen(false);
        setEditing(null);
        saveAddress.reset();
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end">
                <Button size="sm" variant="primary" onPress={openCreate}>
                    <Icon icon="solar:add-circle-outline" className="text-base" />
                    Add address
                </Button>
            </div>

            {addressesQuery.isLoading ? (
                <p className="py-8 text-center text-sm text-default-500">
                    Loading your addresses...
                </p>
            ) : addressesQuery.isError ? (
                <Alert status="danger">
                    <Alert.Content>
                        <Alert.Title>We could not load your addresses</Alert.Title>
                        <Alert.Description>
                            {getErrorMessage(addressesQuery.error)}
                        </Alert.Description>
                    </Alert.Content>
                </Alert>
            ) : addresses.length === 0 ? (
                <EmptyState
                    icon="solar:map-point-outline"
                    title="No addresses saved"
                    description="Add a shipping address so you don't have to type it in every time."
                    actionLabel="Add an address"
                    onAction={openCreate}
                />
            ) : (
                addresses.map((address) => (
                    <Card.Root key={address.id} className="border border-default-200">
                        <Card.Content className="py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">
                                        {address.label || "Address"}
                                    </p>
                                    {address.isDefaultShipping && (
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
                                        aria-label={`Edit ${address.label || "address"}`}
                                        onPress={() => openEdit(address)}
                                    >
                                        <Icon icon="solar:pen-outline" className="text-base" />
                                    </Button>
                                    <Button
                                        isIconOnly
                                        isDisabled={deleteAddress.isPending}
                                        size="sm"
                                        variant="ghost"
                                        aria-label={`Delete ${address.label || "address"}`}
                                        onPress={() => deleteAddress.mutate(address.id)}
                                    >
                                        <Icon icon="solar:trash-bin-minimalistic-outline" className="text-base text-danger" />
                                    </Button>
                                </div>
                            </div>

                            <Separator className="my-3" />

                            <div className="space-y-0.5 text-sm text-default-500">
                                <p className="font-medium text-foreground">{address.recipientName}</p>
                                <p>{formatAddress(address)}</p>
                                {address.phone && <p className="pt-1">{address.phone}</p>}
                            </div>
                        </Card.Content>
                    </Card.Root>
                ))
            )}

            {deleteAddress.isError && (
                <Alert status="danger">
                    <Alert.Content>
                        <Alert.Title>We could not delete that address</Alert.Title>
                        <Alert.Description>
                            {getErrorMessage(deleteAddress.error)}
                        </Alert.Description>
                    </Alert.Content>
                </Alert>
            )}

            {isFormOpen && (
                <AddressFormModal
                    address={editing}
                    error={saveAddress.error}
                    isOpen
                    isPending={saveAddress.isPending}
                    key={editing?.id ?? "new"}
                    onClose={closeForm}
                    onSubmit={(values) =>
                        saveAddress.mutate(
                            { ...(editing ? { addressId: editing.id } : {}), values },
                            {
                                onSuccess: () => {
                                    setIsFormOpen(false);
                                    setEditing(null);
                                },
                            },
                        )
                    }
                />
            )}
        </div>
    );
}
