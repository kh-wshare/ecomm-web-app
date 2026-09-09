"use client";

import { usePathname, useRouter } from "next/navigation";
import { CloseButton } from "@heroui/react";

import type { ThemeConfig } from "@/types/theme";
import type { PublicMerchant } from "@repo/types";

export function ProfileItemHeaderTitle({
    isGlobal = false,
    merchant,
    config,
}: {
    isGlobal: boolean;
    merchant: PublicMerchant;
    config: ThemeConfig;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const segment = pathname?.split("/").filter(Boolean).pop() ?? "";
    const title = segment.charAt(0).toUpperCase() + segment.slice(1);
    const basePath = `/${merchant.slug}`;
    const isHomeActive = pathname === basePath;

    return (
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-background/90 backdrop-blur-xl dark:border-neutral-700">
            <div className="relative mx-auto flex h-14 w-full max-w-2xl items-center justify-center px-4">
                {!isGlobal && (
                    <CloseButton
                        aria-label="Close"
                        className="absolute left-4 size-9 rounded-full bg-default text-muted hover:bg-default-hover hover:text-foreground active:scale-95"
                        onPress={() => router.push(`${basePath}/profile`)}
                    />
                )}

                {isHomeActive ? (
                    <div className="flex min-w-0 items-center gap-3">
                        {config.storefront.logoUrl ? (
                            <span
                                aria-label={merchant.name}
                                className="block h-10 w-32 bg-contain bg-left bg-no-repeat"
                                role="img"
                                style={{
                                    backgroundImage: `url("${config.storefront.logoUrl}")`,
                                }}
                            />
                        ) : (
                            <span
                                className="truncate text-base font-semibold"
                                style={{
                                    fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
                                }}
                            >
                                {merchant.name}
                            </span>
                        )}
                    </div>
                ) : (
                    <h1 className="text-base font-semibold tracking-tight">{title}</h1>
                )}
            </div>
        </header>
    );
}
