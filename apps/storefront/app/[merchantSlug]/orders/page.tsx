import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrdersTabs } from "@/components/storefront/orders-tabs";
import { getPublicStorefront } from "@/lib/storefront/storefront-data";
import { isStorefrontSlug } from "@/lib/storefront/slug";

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
            title: `Orders - ${storefront.merchant.name}`,
        };
    } catch {
        return { title: "Store unavailable" };
    }
}

export default async function OrdersPage({
    params,
}: {
    params: Promise<{ merchantSlug: string }>;
}) {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) notFound();

    await getPublicStorefront(merchantSlug);

    return (
        <main className="mx-auto w-full max-w-2xl px-4 pb-10 pt-4">
            <OrdersTabs merchantSlug={merchantSlug} />
        </main>
    );
}
