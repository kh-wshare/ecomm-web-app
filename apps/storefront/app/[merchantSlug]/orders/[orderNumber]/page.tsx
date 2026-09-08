import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderDetailContent } from "@/components/storefront/order-detail-content";
import { getPublicStorefront } from "@/lib/storefront/storefront-data";
import { isStorefrontSlug } from "@/lib/storefront/slug";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ merchantSlug: string; orderNumber: string }>;
}): Promise<Metadata> {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) {
        return { title: "Store not found" };
    }

    try {
        const storefront = await getPublicStorefront(merchantSlug);

        return {
            title: `Order details - ${storefront.merchant.name}`,
        };
    } catch {
        return { title: "Store unavailable" };
    }
}

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ merchantSlug: string; orderNumber: string }>;
}) {
    const { merchantSlug, orderNumber } = await params;

    if (!isStorefrontSlug(merchantSlug)) notFound();

    await getPublicStorefront(merchantSlug);

    return (
        <main className="mx-auto w-full max-w-2xl px-4">
            <OrderDetailContent merchantSlug={merchantSlug} orderNumber={orderNumber} />
        </main>
    );
}
