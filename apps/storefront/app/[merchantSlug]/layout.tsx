import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import "@repo/ui/styles.css";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getPublicStorefront } from "@/lib/storefront/storefront-data";
import { isStorefrontSlug } from "@/lib/storefront/slug";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";

export const metadata: Metadata = {
    title: "Storefront",
    description: "Public storefront workspace for product discovery, cart, checkout, and order status.",
};

export const viewport: Viewport = {
    themeColor: "#f8fafc",
};

export default async function MerchantLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ merchantSlug: string }>;
}) {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) notFound();

    const storefront = await getPublicStorefront(merchantSlug);
    const config = normalizeThemeConfig(storefront.theme.config);

    return (
        <StorefrontShell config={config} merchant={storefront.merchant}>
            {children}
        </StorefrontShell>
    );
}
