import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@iconify/react";

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
            title: `Contacts - ${storefront.merchant.name}`,
        };
    } catch {
        return { title: "Store unavailable" };
    }
}

export default async function ProfileContactsPage({
    params,
}: {
    params: Promise<{ merchantSlug: string }>;
}) {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) notFound();

    const storefront = await getPublicStorefront(merchantSlug);
    const { merchant } = storefront;

    const contactRows = [
        merchant.email
            ? {
                  key: "email",
                  icon: "solar:letter-outline",
                  label: "Email",
                  value: merchant.email,
                  href: `mailto:${merchant.email}`,
              }
            : null,
        merchant.phone
            ? {
                  key: "phone",
                  icon: "solar:phone-outline",
                  label: "Phone",
                  value: merchant.phone,
                  href: `tel:${merchant.phone}`,
              }
            : null,
    ].filter((row): row is NonNullable<typeof row> => row !== null);

    return (
        <main className="pb-10 pt-6">
            <p className="text-sm text-default-500">
                Questions about a product or your order? Reach out to {merchant.name}.
            </p>

            <div className="mt-6 flex flex-col gap-1 rounded-3xl border border-neutral-200 p-2 dark:border-neutral-700">
                {contactRows.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-default-500">
                        This store hasn&apos;t added contact details yet.
                    </p>
                ) : (
                    contactRows.map((row) => (
                        <a
                            className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                            href={row.href}
                            key={row.key}
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                                <Icon icon={row.icon} className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">{row.label}</span>
                                <span className="block truncate text-xs text-default-500">{row.value}</span>
                            </span>
                            <Icon icon="solar:alt-arrow-right-linear" className="size-4 shrink-0 text-default-300" />
                        </a>
                    ))
                )}
            </div>
        </main>
    );
}
