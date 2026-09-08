
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicStorefront } from "@/lib/storefront/storefront-data";
import { isStorefrontSlug } from "@/lib/storefront/slug";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";
import { ProfileContent } from "@/components/storefront/profile-content";

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
        const config = normalizeThemeConfig(storefront.theme.config);

        return {
            description:
                config.storefront.seoDescription ||
                `Shop the latest products from ${storefront.merchant.name}.`,
            icons: config.storefront.faviconUrl
                ? { icon: config.storefront.faviconUrl }
                : undefined,
            title: `Profile - ${config.storefront.seoTitle || storefront.merchant.name}`,
        };
    } catch {
        return { title: "Store unavailable" };
    }
}

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ merchantSlug: string }>;
}) {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) {
        notFound();
    }

    return (
        <main className="mx-auto w-full max-w-2xl px-4 pb-10 pt-6">
            <ProfileContent merchantSlug={merchantSlug} />
        </main>
    );
}

