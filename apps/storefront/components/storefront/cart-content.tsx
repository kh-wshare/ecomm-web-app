"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Alert, Button, Chip, Input } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import type { PublicMerchant } from "@/types/storefront";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";
import { radiusValue } from "@/lib/theme/radius";
import { formatCurrency } from "@/lib/formatters/currency";
import { getErrorMessage } from "@/lib/errors/api-error";
import { checkoutStorage } from "@/lib/checkout/checkout-storage";
import {
  customerSessionQueryKey,
  getCustomerSession,
} from "@/lib/storefront/customer-session";
import {
  useAssignCartAddress,
  useCart,
  useCartAddresses,
  useCheckoutCart,
  useDeliveryOptions,
  useSaveCartAddress,
  useSelectDelivery,
  useUpdateCartContact,
  useUpdateCartItem,
} from "@/lib/cart/use-cart";
import { AddressFormModal } from "@/components/storefront/address-form-modal";
import { formatAddress, type Cart, type DeliveryOption } from "@/types/cart";

export function CartContent({
  config,
  merchant,
}: {
  config: ReturnType<typeof normalizeThemeConfig>;
  merchant: PublicMerchant;
}) {
  const router = useRouter();
  const { cart, isLoading: isCartLoading, itemCount } = useCart(merchant.slug);
  const updateItem = useUpdateCartItem(merchant.slug);
  const updateContact = useUpdateCartContact(merchant.slug);
  const addressesQuery = useCartAddresses(merchant.slug);
  const saveAddress = useSaveCartAddress(merchant.slug);
  const assignAddress = useAssignCartAddress(merchant.slug);
  const deliveryQuery = useDeliveryOptions(merchant.slug);
  const selectDelivery = useSelectDelivery(merchant.slug);
  const checkout = useCheckoutCart(merchant.slug);

  const customerQuery = useQuery({
    queryFn: getCustomerSession,
    queryKey: customerSessionQueryKey,
  });

  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);

  const lines = cart?.items ?? [];
  const currency = cart?.currency ?? "USD";
  const addresses = addressesQuery.data ?? [];
  const deliveryOptions = deliveryQuery.data ?? [];

  // The cart carries the contact details onto the order, so a signed-in
  // shopper's are copied across once rather than retyped.
  const customer = customerQuery.data?.user;
  useEffect(() => {
    if (!cart || !customer || cart.customerEmail) return;

    updateContact.mutate({
      customerEmail: customer.email,
      customerName: customer.fullName,
      ...(customer.phone ? { customerPhone: customer.phone } : {}),
    });
    // updateContact is a stable mutation object; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id, cart?.customerEmail, customer?.id]);

  // The API refuses to save an address until the cart knows who the order is
  // for: it wants a name plus an email or a phone number.
  const hasContact = Boolean(
    cart?.customerName && (cart?.customerEmail || cart?.customerPhone),
  );
  const hasAddress = Boolean(cart?.shippingAddress);
  const needsAddress = !hasAddress;
  const selectedDelivery = cart?.delivery ?? null;
  const noDeliveryAvailable =
    hasAddress && !deliveryQuery.isLoading && deliveryOptions.length === 0;
  const canCheckout =
    lines.length > 0 && Boolean(selectedDelivery) && !checkout.isPending;

  if (isCartLoading && !cart) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-16 text-center sm:px-8">
        <p className="text-sm text-default-500">Loading your cart...</p>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-5 pb-24 pt-16 text-center sm:px-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Icon icon="solar:cart-large-2-linear" className="text-2xl" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Your cart is empty
        </h1>
        <p className="text-sm text-default-500">
          Items you add to your cart will show up here.
        </p>
        <Link href={`/${merchant.slug}`} className="mt-2">
          <Button size="sm" variant="primary">
            Start shopping
          </Button>
        </Link>
      </main>
    );
  }

  const borderColor = `color-mix(in srgb, ${config.colors.text} 12%, transparent)`;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-32 pt-6 sm:px-8 sm:pt-8">
      <h1
        className="text-2xl font-semibold tracking-tight sm:text-3xl"
        style={{
          fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
        }}
      >
        Your cart
      </h1>

      {/* Items */}
      <Section borderColor={borderColor} title={`${itemCount} item${itemCount === 1 ? "" : "s"}`}>
        <div className="flex flex-col gap-4">
          {lines.map((line) => (
            <div
              className="flex items-center gap-3"
              key={line.id ?? `${line.productId}:${line.variantId ?? ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{line.name}</p>
                <p className="mt-0.5 text-xs text-default-500">{line.sku}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    aria-label={`Decrease quantity of ${line.name}`}
                    className="grid size-7 place-items-center rounded-full border border-default-200 disabled:opacity-40"
                    disabled={!line.id || updateItem.isPending}
                    type="button"
                    onClick={() =>
                      line.id &&
                      updateItem.mutate({
                        itemId: line.id,
                        quantity: line.quantity - 1,
                      })
                    }
                  >
                    <Icon icon="gravity-ui:minus" className="size-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-medium">
                    {line.quantity}
                  </span>
                  <button
                    aria-label={`Increase quantity of ${line.name}`}
                    className="grid size-7 place-items-center rounded-full border border-default-200 disabled:opacity-40"
                    disabled={!line.id || updateItem.isPending}
                    type="button"
                    onClick={() =>
                      line.id &&
                      updateItem.mutate({
                        itemId: line.id,
                        quantity: line.quantity + 1,
                      })
                    }
                  >
                    <Icon icon="gravity-ui:plus" className="size-3" />
                  </button>
                </div>
                <span className="w-20 text-right text-sm font-semibold">
                  {formatCurrency(line.totalPrice, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section borderColor={borderColor} title="Your details">
        <ContactFields
          cart={cart}
          error={updateContact.error}
          isPending={updateContact.isPending}
          onSave={(contact) => updateContact.mutate(contact)}
        />
      </Section>

      {/* Shipping address */}
      <Section borderColor={borderColor} title="Delivery address">
        {!hasContact ? (
          <p className="text-sm text-default-500">
            Tell us who this order is for and we&apos;ll save your address next.
          </p>
        ) : addressesQuery.isLoading ? (
          <p className="text-sm text-default-500">Loading your addresses...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {addresses.map((address) => {
              // The cart stores a snapshot of the address rather than a
              // reference to it, so the selected one is matched on content.
              const isSelected =
                cart?.shippingAddress?.line1 === address.line1 &&
                cart?.shippingAddress?.recipientName === address.recipientName;

              return (
                <button
                  className="flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors"
                  key={address.id}
                  style={{
                    borderColor: isSelected
                      ? config.colors.primary
                      : borderColor,
                  }}
                  type="button"
                  onClick={() =>
                    assignAddress.mutate({ addressId: address.id })
                  }
                >
                  <span
                    aria-hidden
                    className="mt-1 grid size-4 shrink-0 place-items-center rounded-full border"
                    style={{
                      borderColor: isSelected
                        ? config.colors.primary
                        : borderColor,
                    }}
                  >
                    {isSelected && (
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: config.colors.primary }}
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {address.label || address.recipientName}
                      </span>
                      {address.isDefaultShipping && (
                        <Chip size="sm" color="accent" variant="soft">
                          <Chip.Label>Default</Chip.Label>
                        </Chip>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-default-500">
                      {formatAddress(address)}
                    </span>
                  </span>
                </button>
              );
            })}

            <Button
              className="mt-1 self-start"
              size="sm"
              type="button"
              variant="secondary"
              onPress={() => setIsAddressFormOpen(true)}
            >
              <Icon icon="solar:add-circle-outline" className="text-base" />
              Add a new address
            </Button>

            {needsAddress && addresses.length > 0 && (
              <p className="text-xs text-default-500">
                Choose where this order should go.
              </p>
            )}
          </div>
        )}

        {assignAddress.isError && (
          <Alert className="mt-3" status="danger">
            <Alert.Content>
              <Alert.Title>We could not use that address</Alert.Title>
              <Alert.Description>
                {getErrorMessage(assignAddress.error)}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </Section>

      {/* Delivery method */}
      <Section borderColor={borderColor} title="Delivery method">
        {needsAddress ? (
          <p className="text-sm text-default-500">
            Choose a delivery address first and we&apos;ll price your options.
          </p>
        ) : deliveryQuery.isLoading ? (
          <p className="text-sm text-default-500">Checking what we can do...</p>
        ) : noDeliveryAvailable ? (
          <Alert status="warning">
            <Alert.Content>
              <Alert.Title>We don&apos;t deliver here yet</Alert.Title>
              <Alert.Description>
                No delivery option covers this address. Try another address, or
                pick one of the store&apos;s collection points if it has any.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : (
          <div className="flex flex-col gap-2">
            {deliveryOptions.map((option) => (
              <DeliveryOptionRow
                borderColor={borderColor}
                currency={currency}
                isSelected={selectedDelivery?.methodId === option.methodId}
                key={option.methodId}
                option={option}
                primaryColor={config.colors.primary}
                onSelect={() => selectDelivery.mutate(option.methodId)}
              />
            ))}
          </div>
        )}

        {selectDelivery.isError && (
          <Alert className="mt-3" status="danger">
            <Alert.Content>
              <Alert.Title>We could not choose that option</Alert.Title>
              <Alert.Description>
                {getErrorMessage(selectDelivery.error)}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </Section>

      {/* Totals */}
      <div
        className="mt-4 flex flex-col gap-2 rounded-2xl border p-5"
        style={{ borderColor }}
      >
        <TotalRow
          label="Subtotal"
          value={formatCurrency(cart?.subtotalAmount ?? 0, currency)}
        />
        <TotalRow
          label="Shipping"
          value={
            selectedDelivery
              ? formatCurrency(cart?.shippingAmount ?? 0, currency)
              : "Not chosen yet"
          }
        />
        <div
          className="mt-1 flex items-center justify-between border-t pt-3 text-base font-semibold"
          style={{ borderColor }}
        >
          <span>Total</span>
          <span>{formatCurrency(cart?.totalAmount ?? 0, currency)}</span>
        </div>

        {checkout.isError && (
          <Alert className="mt-3" status="danger">
            <Alert.Content>
              <Alert.Title>We could not start checkout</Alert.Title>
              <Alert.Description>
                {getErrorMessage(checkout.error)}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        <Button
          className="mt-3 h-12 w-full text-sm font-bold text-white"
          isDisabled={!canCheckout}
          style={{
            backgroundColor: config.colors.primary,
            borderRadius: radiusValue(config.layout.borderRadius),
          }}
          type="button"
          variant="primary"
          onPress={() =>
            checkout.mutate(undefined, {
              onSuccess: (session) => {
                checkoutStorage.set(session.id, {
                  merchantSlug: merchant.slug,
                  token: session.checkoutToken,
                });
                router.push(`/checkout/${session.id}`);
              },
            })
          }
        >
          {checkout.isPending
            ? "Reserving your items..."
            : selectedDelivery
              ? "Checkout"
              : "Choose a delivery method"}
        </Button>
      </div>

      {isAddressFormOpen && (
        <AddressFormModal
          error={saveAddress.error}
          isOpen
          isPending={saveAddress.isPending}
          onClose={() => {
            if (saveAddress.isPending) return;
            setIsAddressFormOpen(false);
            saveAddress.reset();
          }}
          onSubmit={(values) =>
            saveAddress.mutate(
              { values },
              {
                onSuccess: (address) => {
                  setIsAddressFormOpen(false);
                  // A brand-new address is almost certainly the one they want.
                  assignAddress.mutate({ addressId: address.id });
                },
              },
            )
          }
        />
      )}
    </main>
  );
}

function ContactFields({
  cart,
  error,
  isPending,
  onSave,
}: {
  cart: Cart | null;
  error: unknown;
  isPending: boolean;
  onSave: (contact: {
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
  }) => void;
}) {
  const saved = Boolean(
    cart?.customerName && (cart?.customerEmail || cart?.customerPhone),
  );
  const [isEditing, setIsEditing] = useState(!saved);
  const [name, setName] = useState(cart?.customerName ?? "");
  const [email, setEmail] = useState(cart?.customerEmail ?? "");
  const [phone, setPhone] = useState(cart?.customerPhone ?? "");

  // A signed-in shopper's details arrive from the session after first paint,
  // so the fields follow the cart until the shopper starts editing them.
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const cartKey = `${cart?.customerName ?? ""}|${cart?.customerEmail ?? ""}|${cart?.customerPhone ?? ""}`;
  if (saved && lastSynced !== cartKey && !isPending) {
    setLastSynced(cartKey);
    setName(cart?.customerName ?? "");
    setEmail(cart?.customerEmail ?? "");
    setPhone(cart?.customerPhone ?? "");
    setIsEditing(false);
  }

  const canSave = name.trim().length > 0 && (email.trim() || phone.trim());

  if (saved && !isEditing) {
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="font-medium">{cart?.customerName}</p>
          <p className="mt-0.5 text-default-500">
            {[cart?.customerEmail, cart?.customerPhone]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <Button
          size="sm"
          type="button"
          variant="secondary"
          onPress={() => setIsEditing(true)}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;

        onSave({
          customerName: name.trim(),
          ...(email.trim() ? { customerEmail: email.trim() } : {}),
          ...(phone.trim() ? { customerPhone: phone.trim() } : {}),
        });
      }}
    >
      <ContactField
        id="cart-contact-name"
        label="Full name"
        required
        value={name}
        onChange={setName}
      />
      <ContactField
        id="cart-contact-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
      />
      <ContactField
        id="cart-contact-phone"
        label="Phone"
        type="tel"
        value={phone}
        onChange={setPhone}
      />
      <p className="text-xs text-default-500">
        We need your name and either an email or a phone number so the store can
        reach you about this order.
      </p>

      {Boolean(error) && (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>We could not save your details</Alert.Title>
            <Alert.Description>{getErrorMessage(error)}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Button
        className="self-start"
        isDisabled={!canSave || isPending}
        size="sm"
        type="submit"
        variant="primary"
      >
        {isPending ? "Saving..." : "Save details"}
      </Button>
    </form>
  );
}

function ContactField({
  id,
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1" htmlFor={id}>
      <span className="text-xs font-medium text-default-500">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DeliveryOptionRow({
  borderColor,
  currency,
  isSelected,
  onSelect,
  option,
  primaryColor,
}: {
  borderColor: string;
  currency: string;
  isSelected: boolean;
  onSelect: () => void;
  option: DeliveryOption;
  primaryColor: string;
}) {
  const eta =
    option.estimatedMinDays === null && option.estimatedMaxDays === null
      ? null
      : option.estimatedMinDays === option.estimatedMaxDays
        ? `${option.estimatedMinDays} day${option.estimatedMinDays === 1 ? "" : "s"}`
        : `${option.estimatedMinDays ?? 0}–${option.estimatedMaxDays ?? option.estimatedMinDays} days`;

  return (
    <button
      className="flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors"
      style={{ borderColor: isSelected ? primaryColor : borderColor }}
      type="button"
      onClick={onSelect}
    >
      <span
        aria-hidden
        className="grid size-4 shrink-0 place-items-center rounded-full border"
        style={{ borderColor: isSelected ? primaryColor : borderColor }}
      >
        {isSelected && (
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{option.name}</span>
        <span className="mt-0.5 block text-xs text-default-500">
          {[
            option.type === "PICKUP" ? "Collect in store" : option.zoneName,
            eta,
          ]
            .filter(Boolean)
            .join(" · ") || option.description || "Standard"}
        </span>
      </span>

      <span className="shrink-0 text-sm font-semibold">
        {Number(option.fee) === 0 ? "Free" : formatCurrency(option.fee, currency)}
      </span>
    </button>
  );
}

function Section({
  borderColor,
  children,
  title,
}: {
  borderColor: string;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section
      className="mt-4 rounded-2xl border p-5"
      style={{ borderColor }}
    >
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-default-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
