import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LanguageContent } from "@/components/storefront/language-content";
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
            title: `Language - ${storefront.merchant.name}`,
        };
    } catch {
        return { title: "Store unavailable" };
    }
}

export default async function ProfileLanguagePage({
    params,
}: {
    params: Promise<{ merchantSlug: string }>;
}) {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) notFound();

    await getPublicStorefront(merchantSlug);

    return (
        <main className="pb-10 pt-6">
            <p className="text-sm text-default-500">
                Choose the language you&apos;d like to browse this store in.
            </p>

            <div className="mt-6">
                <LanguageContent />
            </div>
        </main>
    );
}
