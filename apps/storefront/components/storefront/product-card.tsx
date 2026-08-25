import Link from "next/link";
import NextImage from "next/image";
import { Image } from "@heroui/image";
import type { PublicMerchant, PublicProduct } from "@/types/storefront";
import type { ThemeConfig } from "@/types/theme";
import { formatCurrency } from "@/lib/formatters/currency";
import { radiusValue } from "@/components/storefront/storefront-shell";

export function ProductCard({
  config,
  merchant,
  product,
}: {
  config: ThemeConfig;
  merchant: PublicMerchant;
  product: PublicProduct;
}) {
  const media = product.media[0];

  const price =
    product.variants.length > 0
      ? Math.min(...product.variants.map((variant) => Number(variant.price)))
      : Number(product.price);

  const hasVariants = product.variants.length > 0;

  const availabilityLabel = product.isPurchasable
    ? "In stock"
    : product.isAvailable
      ? "View product"
      : "Sold out";

  const isSoldOut = !product.isPurchasable && !product.isAvailable;

  return (
    <Link
      href={`/${merchant.slug}/products/${product.slug}`}
      className="group block min-w-0 overflow-hidden border bg-transparent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
      style={{
        borderColor: `color-mix(in srgb, ${config.colors.text} 12%, transparent)`,
        borderRadius: radiusValue(config.layout.borderRadius),
      }}
    >
      {/* Product media wrapper */}
      <div className="relative aspect-[6/5] w-full overflow-hidden bg-black/[0.03]">
        {media?.type === "IMAGE" && (
          <Image
            src={media.url}
            as={NextImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            classNames={{
              wrapper: "size-full max-w-none!",
              img: "size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105",
            }}
          />
        )}

        {media?.type === "VIDEO" && (
          <video
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            muted
            playsInline
            autoPlay
            loop
            preload="metadata"
            src={media.url}
          />
        )}

        {!media && (
          <div className="grid size-full place-items-center px-6 text-center">
            <span className="text-sm opacity-40">{product.name}</span>
          </div>
        )}

        {/* Subtle image overlay */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/[0.03]" />

        {/* Availability badge */}
        <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[10px]"
            style={{
              backgroundColor: isSoldOut
                ? "rgba(254, 226, 226, 0.92)"
                : `color-mix(in srgb, ${config.colors.background} 90%, transparent)`,
              color: isSoldOut ? "#b91c1c" : config.colors.text,
            }}
          >
            {availabilityLabel}
          </span>
        </div>
      </div>

      {/* Product information */}
      <div className="p-3 sm:p-4">
        <div className="min-w-0">
          <h3
            className="line-clamp-2 text-sm font-semibold leading-5 sm:text-[15px]"
            style={{
              fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
            }}
          >
            {product.name}
          </h3>

          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 sm:mt-2">
            {hasVariants && (
              <span className="shrink-0 text-xs opacity-55">
                Price - 
              </span>
            )}

            <p className="truncate text-sm font-medium sm:text-[15px]">
              {formatCurrency(price, product.currency)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}