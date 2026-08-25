import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StorefrontHome } from "@/components/storefront/storefront-home";
import {
    getPublicArticles,
    getPublicProducts,
    getPublicStorefront,
} from "@/lib/storefront/storefront-data";
import { isStorefrontSlug } from "@/lib/storefront/slug";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";
import { PublicArticle } from "@/types/storefront";
import { ThemeConfig } from "@/types/theme";
import { StorefrontShell } from "@/components/storefront/storefront-shell";

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
            title: config.storefront.seoTitle || storefront.merchant.name,
        };
    } catch {
        return { title: "Store unavailable" };
    }
}

export default async function SocialPage({
    params,
}: {
    params: Promise<{ merchantSlug: string }>;
}) {
    const { merchantSlug } = await params;

    if (!isStorefrontSlug(merchantSlug)) notFound();

    const [storefront, articles] = await Promise.all([
        getPublicStorefront(merchantSlug),
        getPublicArticles(merchantSlug),
    ]);

    const config = normalizeThemeConfig(storefront.theme.config);

    return (
        <StorefrontShell config={config} merchant={storefront.merchant}>
            <SocialFeed
                articles={articles}
                config={config}
                key={1}
                merchantSlug={storefront.merchant.slug}
            />
        </StorefrontShell>
    );
}

function SocialFeed({
    articles,
    config,
    merchantSlug,
}: {
    articles: PublicArticle[];
    config: ReturnType<typeof normalizeThemeConfig>;
    merchantSlug: string;
}) {
    if (!articles.length) return null;

    return (
        <section className={spacingClass(config.layout.spacing)}>
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <h2
                    className="text-3xl font-semibold tracking-tight"
                    style={{
                        fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
                    }}
                >
                    {config.socialFeed.title}
                </h2>
                <div className="mt-7 grid gap-5 md:grid-cols-3">
                    {articles.slice(0, 3).map((article) => (
                        <article
                            className="overflow-hidden border"
                            key={article.id}
                            style={{
                                borderColor: `color-mix(in srgb, ${config.colors.text} 13%, transparent)`,
                                borderRadius: radiusValue(config.layout.borderRadius),
                            }}
                        >
                            <div
                                className="aspect-[16/10] bg-black/5 bg-cover bg-center"
                                style={
                                    article.mediaUrls[0]
                                        ? {
                                            backgroundImage: `url("${article.mediaUrls[0]}")`,
                                        }
                                        : undefined
                                }
                            />
                            <div className="p-5">
                                <h3 className="font-semibold">{article.title}</h3>
                                <p className="mt-2 line-clamp-3 text-sm leading-6 opacity-65">
                                    {article.content}
                                </p>
                                <p
                                    className="mt-4 text-xs font-bold uppercase tracking-wide"
                                    style={{ color: config.colors.accent }}
                                >
                                    {merchantSlug} · Store story
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>

    );
}
function spacingClass(
    spacing: ReturnType<typeof normalizeThemeConfig>["layout"]["spacing"],
) {
    return {
        compact: "py-8",
        comfortable: "pb-12 sm:pb-16",
        spacious: "pb-16 sm:pb-24",
    }[spacing];
}

export function radiusValue(radius: ThemeConfig["layout"]["borderRadius"]) {
    return {
        none: "0",
        small: "0.5rem",
        medium: "1rem",
        large: "1.75rem",
    }[radius];
}

