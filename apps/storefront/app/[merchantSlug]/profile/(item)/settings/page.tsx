import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SettingsSection } from "@/components/storefront/setting-section";
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
            title: `Settings - ${storefront.merchant.name}`,
        };
    } catch {
        return { title: "Store unavailable" };
    }
}

export default async function ProfileSettingsPage({
    params,
}: {
    params: Promise<{ merchantSlug: string }>;
}) {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) notFound();

    await getPublicStorefront(merchantSlug);

    return (
        <main className="pb-10 pt-6">
            <div>
                <SettingsSection merchantSlug={merchantSlug} />
            </div>
        </main>
    );
}
