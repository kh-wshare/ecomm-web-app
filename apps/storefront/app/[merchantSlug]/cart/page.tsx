import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CartContent } from "@/components/storefront/cart-content";
import { getPublicStorefront } from "@/lib/storefront/storefront-data";
import { isStorefrontSlug } from "@/lib/storefront/slug";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ merchantSlug: string }>;
}): Promise<Metadata> {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) {
        return { title: "Store not found" };
    }

    try {
        const storefront = await getPublicStorefront(merchantSlug);

        return {
            title: `Cart - ${storefront.merchant.name}`,
        };
    } catch {
        return { title: "Store unavailable" };
    }
}

export default async function CartPage({
    params,
}: {
    params: Promise<{ merchantSlug: string }>;
}) {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) notFound();

    const storefront = await getPublicStorefront(merchantSlug);
    const config = normalizeThemeConfig(storefront.theme.config);

    return <CartContent config={config} merchant={storefront.merchant} />;
}
