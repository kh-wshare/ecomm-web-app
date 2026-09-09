import Link from "next/link";

import type { PublicProduct, PublicStorefront } from "@/types/storefront";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { PurchasePanel } from "@/components/storefront/purchase-panel";

export function StorefrontProductDetail({
  product,
  storefront,
}: {
  product: PublicProduct;
  storefront: PublicStorefront;
}) {
  const config = normalizeThemeConfig(storefront.theme.config);

  return (
      <main className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-10">
        <Link
          className="inline-flex text-sm font-semibold"
          href={`/${storefront.merchant.slug}`}
          style={{ color: config.colors.accent }}
        >
          ← Back to {storefront.merchant.name}
        </Link>
        <div className="mt-6 grid gap-8">
          <ProductGallery
            config={config}
            media={product.media}
            productName={product.name}
          />
          <PurchasePanel
            config={config}
            merchantSlug={storefront.merchant.slug}
            product={product}
          />
        </div>
      </main>
  );
}
