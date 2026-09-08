"use client";

import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Alert, Button, Card, Chip, Input } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import type { PublicProduct } from "@/types/storefront";
import type { ThemeConfig } from "@/types/theme";
import { env } from "@/lib/env";
import { createCheckoutSession } from "@/lib/checkout/checkout-data";
import { checkoutStorage } from "@/lib/checkout/checkout-storage";
import { formatCurrency } from "@/lib/formatters/currency";
import { getErrorMessage } from "@/lib/errors/api-error";
import { radiusValue } from "@/lib/theme/radius";
import { getCustomerSession } from "@/lib/storefront/customer-session";
import { cartStore } from "@/lib/cart/cart-storage";

export function PurchasePanel({
  config,
  merchantSlug,
  product,
}: {
  config: ThemeConfig;
  merchantSlug: string;
  product: PublicProduct;
}) {
  const router = useRouter();
  const optionCarouselRef = useRef<HTMLDivElement>(null);

  const [variantId, setVariantId] = useState<string>(() => {
    return product.variants.length > 0 ? product.variants[0].id : "";
  });

  const [quantity, setQuantity] = useState(1);
  const [shareFeedback, setShareFeedback] = useState("");
  const [justAddedToCart, setJustAddedToCart] = useState(false);

  const selectedVariant = product.variants.find(
    (variant) => variant.id === variantId,
  );

  const hasVariants = product.variants.length > 0;

  const selectedTargetAvailable = selectedVariant
    ? selectedVariant.isAvailable
    : product.baseIsAvailable;

  const canBuy =
    product.isAvailable &&
    product.isPurchasable &&
    selectedTargetAvailable;

  const price = selectedVariant?.price ?? product.price;

  const checkout = useMutation({
    mutationFn: async () => {
      const customer = (await getCustomerSession())?.user;

      return createCheckoutSession({
        merchantSlug,
        ...(customer
          ? {
              customerEmail: customer.email,
              customerId: customer.id,
              customerName: customer.fullName,
              ...(customer.phone
                ? { customerPhone: customer.phone }
                : {}),
            }
          : {}),
        sourceChannel: "WEBSITE",
        items: [
          {
            productId: product.id,
            ...(selectedVariant
              ? { variantId: selectedVariant.id }
              : {}),
            quantity,
          },
        ],
      });
    },

    onSuccess: (session) => {
      checkoutStorage.set(session.id, {
        token: session.checkoutToken,
        merchantSlug,
        productSlug: product.slug,
      });

      router.push(`/checkout/${session.id}`);
    },
  });

  const handleAddToCart = () => {
    cartStore.addItem(merchantSlug, {
      productId: product.id,
      ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
      productSlug: product.slug,
      name: product.name,
      ...(selectedVariant ? { variantName: selectedVariant.name } : {}),
      ...(product.media.find((media) => media.type === "IMAGE")
        ? { image: product.media.find((media) => media.type === "IMAGE")!.url }
        : {}),
      sku: selectedVariant?.sku ?? product.sku,
      price: selectedVariant?.price ?? product.price,
      currency: product.currency,
      quantity,
    });

    setJustAddedToCart(true);
    window.setTimeout(() => setJustAddedToCart(false), 1500);
  };

  const shareUrl = `${env.NEXT_PUBLIC_STOREFRONT_URL}/${merchantSlug}/products/${product.slug}`;

  const availabilityLabel = canBuy
    ? "Ready to order"
    : product.isPurchasable
      ? "Sold out"
      : "Browsing only";

  const scrollOptions = (direction: "next" | "previous") => {
    const carousel = optionCarouselRef.current;

    if (!carousel) {
      return;
    }

    const cardWidth =
      carousel.querySelector("button")?.clientWidth ?? 180;

    carousel.scrollBy({
      behavior: "smooth",
      left:
        direction === "next"
          ? cardWidth + 12
          : -(cardWidth + 12),
    });
  };

  return (
    <Card
      className="w-full shadow-none md:sticky md:top-28"
      variant="secondary"
      style={{
        borderRadius: radiusValue(config.layout.borderRadius),
      }}
    >
      <Card.Content className="p-4 sm:p-6">
        {/* Status */}
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="soft">
            SKU {selectedVariant?.sku ?? product.sku}
          </Chip>

          <Chip
            color={canBuy ? "success" : "danger"}
            size="sm"
            variant="soft"
          >
            {availabilityLabel}
          </Chip>
        </div>

        {/* Product name */}
        <h1
          className="
            mt-3
            text-2xl
            font-semibold
            leading-tight
            tracking-tight
            sm:mt-4
            sm:text-4xl
            lg:text-5xl
          "
          style={{
            fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
          }}
        >
          {product.name}
        </h1>

        {/* Price */}
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 sm:mt-5">
          <p className="text-xl font-semibold sm:text-2xl">
            {formatCurrency(price, product.currency)}
          </p>

          {hasVariants && (
            <p className="text-xs opacity-60 sm:text-sm">
              {product.variants.length + 1} options
            </p>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p
            className="
              mt-5
              whitespace-pre-wrap
              text-sm
              leading-6
              opacity-70
              sm:mt-6
              sm:text-base
              sm:leading-7
            "
          >
            {product.description}
          </p>
        )}

        {/* Variants */}
        {hasVariants && (
          <fieldset className="mt-6 border-t border-current/10 pt-5 sm:mt-7 sm:pt-6">
            <div className="flex items-center justify-between gap-3">
              <legend className="text-sm font-semibold">
                Choose an option
              </legend>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Button
                  aria-label="Previous product option"
                  isIconOnly
                  size="sm"
                  type="button"
                  variant="secondary"
                  onPress={() => scrollOptions("previous")}
                >
                  <Icon
                    className="size-4"
                    icon="gravity-ui:chevron-left"
                  />
                </Button>

                <Button
                  aria-label="Next product option"
                  isIconOnly
                  size="sm"
                  type="button"
                  variant="secondary"
                  onPress={() => scrollOptions("next")}
                >
                  <Icon
                    className="size-4"
                    icon="gravity-ui:chevron-right"
                  />
                </Button>
              </div>
            </div>

            <div
              ref={optionCarouselRef}
              className="
                -mx-4
                mt-3
                overflow-x-auto
                px-4
                pb-2
                sm:-mx-6
                sm:px-6
              "
              style={{
                scrollbarWidth: "none",
              }}
            >
              <div
                className="
                  grid
                  auto-cols-[minmax(145px,75vw)]
                  grid-flow-col
                  gap-3
                  sm:auto-cols-[minmax(160px,1fr)]
                "
              >
                {product.variants.map((variant) => (
                  <ProductOptionCard
                    config={config}
                    isAvailable={variant.isAvailable}
                    isSelected={variant.id === variantId}
                    key={variant.id}
                    name={variant.name}
                    price={formatCurrency(
                      variant.price,
                      product.currency,
                    )}
                    sku={variant.sku}
                    onSelect={() => setVariantId(variant.id)}
                  />
                ))}
              </div>
            </div>
          </fieldset>
        )}

        {/* Quantity + Buy */}
        <div className="mt-6 flex items-center gap-2 sm:mt-7 sm:gap-3">
          {/* Quantity */}
          <div
            className="flex h-12 shrink-0 items-center gap-0.5 p-1 sm:gap-1"
            style={{
              backgroundColor: `color-mix(in srgb, ${config.colors.text} 6%, ${config.colors.background})`,
              borderRadius: radiusValue(
                config.layout.borderRadius,
              ),
            }}
          >
            <Button
              aria-label="Decrease quantity"
              isIconOnly
              isDisabled={quantity <= 1}
              size="md"
              type="button"
              variant="tertiary"
              onPress={() =>
                setQuantity((current) =>
                  Math.max(1, current - 1),
                )
              }
            >
              <Icon
                className="size-4"
                icon="gravity-ui:minus"
              />
            </Button>

            <Input
              aria-label="Quantity"
              className="w-10 bg-transparent text-center shadow-none sm:w-16"
              max="100"
              min="1"
              type="number"
              value={String(quantity)}
              onChange={(event) =>
                setQuantity(
                  Math.min(
                    100,
                    Math.max(
                      1,
                      Number(event.target.value) || 1,
                    ),
                  ),
                )
              }
            />

            <Button
              aria-label="Increase quantity"
              isIconOnly
              isDisabled={quantity >= 100}
              size="md"
              type="button"
              variant="tertiary"
              onPress={() =>
                setQuantity((current) =>
                  Math.min(100, current + 1),
                )
              }
            >
              <Icon
                className="size-4"
                icon="gravity-ui:plus"
              />
            </Button>
          </div>

          {/* Add to cart */}
          <Button
            className="
              h-12
              min-w-0
              flex-1
              px-3
              text-sm
              font-bold
              sm:px-6
            "
            isDisabled={!canBuy || checkout.isPending}
            variant="secondary"
            style={{
              borderRadius: radiusValue(
                config.layout.borderRadius,
              ),
            }}
            type="button"
            onPress={handleAddToCart}
          >
            <Icon
              className="size-4 shrink-0"
              icon={justAddedToCart ? "gravity-ui:check" : "gravity-ui:bag"}
            />

            <span className="truncate">
              {justAddedToCart ? "Added" : "Add to cart"}
            </span>
          </Button>
        </div>

        {/* Buy now */}
        <Button
          className="mt-2 h-12 w-full text-sm font-bold text-white sm:mt-3"
          isDisabled={!canBuy || checkout.isPending}
          variant="primary"
          style={{
            backgroundColor: config.colors.primary,
            borderRadius: radiusValue(config.layout.borderRadius),
          }}
          type="button"
          onPress={() => checkout.mutate()}
        >
          <Icon className="size-4 shrink-0" icon="gravity-ui:shopping-cart" />
          <span className="truncate">
            {checkout.isPending ? "Reserving..." : "Buy now"}
          </span>
        </Button>

        {/* Checkout error */}
        {checkout.isError && (
          <Alert className="mt-4" status="danger">
            <Alert.Content>
              <Alert.Title>
                We could not start checkout
              </Alert.Title>

              <Alert.Description>
                {getErrorMessage(checkout.error)}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {/* Share */}
        <div className="mt-6 border-t border-current/10 pt-5 sm:mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-50">
            Share this product
          </p>

          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            <Button
              className="shrink-0"
              size="sm"
              type="button"
              variant="secondary"
              onPress={() =>
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    shareUrl,
                  )}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Facebook
            </Button>

            <Button
              className="shrink-0"
              size="sm"
              type="button"
              variant="secondary"
              onPress={() =>
                window.open(
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    shareUrl,
                  )}&text=${encodeURIComponent(
                    product.name,
                  )}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              X
            </Button>

            <Button
              className="shrink-0"
              size="sm"
              type="button"
              variant="secondary"
              onPress={async () => {
                if (navigator.share) {
                  await navigator.share({
                    title: product.name,
                    url: window.location.href,
                  });

                  setShareFeedback("Shared");
                } else {
                  await navigator.clipboard.writeText(
                    window.location.href,
                  );

                  setShareFeedback("Link copied");
                }
              }}
            >
              <Icon
                className="size-4"
                icon="gravity-ui:link"
              />

              Share link
            </Button>
          </div>

          {shareFeedback && (
            <p className="mt-2 text-xs font-medium opacity-60">
              {shareFeedback}
            </p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

function ProductOptionCard({
  config,
  isAvailable,
  isSelected,
  name,
  onSelect,
  price,
  sku,
}: {
  config: ThemeConfig;
  isAvailable: boolean;
  isSelected: boolean;
  name: string;
  onSelect: () => void;
  price: string;
  sku: string;
}) {
  const status = isAvailable ? null : "Sold out";

  return (
    <Button
      className="
        h-auto
        min-h-12
        w-full
        justify-start
        border
        p-0
        text-left
        shadow-none
      "
      isDisabled={!isAvailable}
      style={optionCardStyle(config, isSelected)}
      type="button"
      variant="secondary"
      onPress={onSelect}
    >
      <div className="flex size-full flex-col justify-between gap-4 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold sm:text-base">
              {name}
            </span>

            <span className="mt-1 block truncate text-xs opacity-55">
              {status ?? sku}
            </span>
          </div>

          {isSelected ? (
            <span
              className="grid size-6 shrink-0 place-items-center rounded-full text-white"
              style={{
                backgroundColor: config.colors.primary,
              }}
            >
              <Icon
                className="size-3.5"
                icon="gravity-ui:check"
              />
            </span>
          ) : (
            <span
              className="
                grid
                size-6
                shrink-0
                place-items-center
                rounded-full
                border
                border-current/15
                opacity-40
              "
            >
              <Icon
                className="size-3.5"
                icon="gravity-ui:check"
              />
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <span className="text-xs font-medium opacity-50">
            Option
          </span>

          <span className="text-sm font-semibold sm:text-base">
            {price}
          </span>
        </div>
      </div>
    </Button>
  );
}

function optionCardStyle(
  config: ThemeConfig,
  isSelected: boolean,
) {
  return {
    backgroundColor: isSelected
      ? `color-mix(in srgb, ${config.colors.primary} 10%, ${config.colors.background})`
      : `color-mix(in srgb, ${config.colors.text} 4%, ${config.colors.background})`,
    borderColor: isSelected
      ? config.colors.primary
      : `color-mix(in srgb, ${config.colors.text} 12%, transparent)`,
    borderRadius: radiusValue(
      config.layout.borderRadius,
    ),
    color: config.colors.text,
  };
}