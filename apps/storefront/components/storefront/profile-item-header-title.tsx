"use client";

import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { CloseButton, type useOverlayState } from "@heroui/react";

import type { ThemeConfig } from "@/types/theme";
import type { PublicMerchant } from "@repo/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { useCart } from "@/lib/cart/use-cart";
import { StorefrontCustomerAuth } from "@/components/storefront/storefront-customer-auth";

export function ProfileItemHeaderTitle({
    isGlobal = false,
    merchant,
    config,
    cartModal,
}: {
    isGlobal: boolean;
    merchant: PublicMerchant;
    config: ThemeConfig;
    cartModal: ReturnType<typeof useOverlayState>;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const segment = pathname?.split("/").filter(Boolean).pop() ?? "";
    const title = segment.charAt(0).toUpperCase() + segment.slice(1);
    const basePath = `/${merchant.slug}`;
    const isHomeActive = pathname === basePath;

    const { cart, itemCount } = useCart(merchant.slug);
    const cartCurrency = cart.items[0]?.currency ?? "USD";
    const cartSubtotal = cart.items.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0,
    );

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

                {isGlobal && (
                    <nav className="absolute right-4 hidden items-center gap-3 text-sm font-medium md:flex">
                        {/* Cart hover preview */}
                        <div className="group relative">
                            <button
                                aria-label="View cart"
                                className="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                                type="button"
                                onClick={cartModal.open}
                            >
                                <Icon icon="solar:cart-large-2-linear" className="size-5" />
                                {itemCount > 0 && (
                                    <span
                                        className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold leading-4 text-white"
                                        style={{ backgroundColor: config.colors.accent }}
                                    >
                                        {itemCount > 9 ? "9+" : itemCount}
                                    </span>
                                )}
                            </button>

                            <div
                                className="invisible absolute right-0 top-full z-50 w-80 translate-y-1 rounded-2xl border p-4 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-2 group-hover:opacity-100"
                                style={{
                                    backgroundColor: config.colors.background,
                                    borderColor: `color-mix(in srgb, ${config.colors.text} 12%, transparent)`,
                                    color: config.colors.text,
                                }}
                            >
                                <p className="text-sm font-semibold">Your cart</p>

                                {cart.items.length === 0 ? (
                                    <p className="mt-3 text-sm opacity-60">Your cart is empty.</p>
                                ) : (
                                    <>
                                        <div className="mt-3 flex max-h-72 flex-col gap-3 overflow-y-auto">
                                            {cart.items.map((item) => (
                                                <div
                                                    className="flex items-center gap-3"
                                                    key={`${item.productId}:${item.variantId ?? ""}`}
                                                >
                                                    <div
                                                        className="size-11 shrink-0 rounded-lg bg-black/5 bg-cover bg-center"
                                                        style={
                                                            item.image
                                                                ? { backgroundImage: `url("${item.image}")` }
                                                                : undefined
                                                        }
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-semibold">{item.name}</p>
                                                        <p className="mt-0.5 text-[11px] opacity-60">
                                                            Qty {item.quantity} ·{" "}
                                                            {formatCurrency(item.price, item.currency)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className="mt-4 flex items-center justify-between border-t pt-3 text-sm font-semibold"
                                            style={{
                                                borderColor: `color-mix(in srgb, ${config.colors.text} 12%, transparent)`,
                                            }}
                                        >
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(cartSubtotal, cartCurrency)}</span>
                                        </div>

                                        <button
                                            className="mt-3 flex h-10 w-full items-center justify-center rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                                            style={{ backgroundColor: config.colors.primary }}
                                            type="button"
                                            onClick={cartModal.open}
                                        >
                                            Checkout
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <StorefrontCustomerAuth slug={merchant.slug} />
                    </nav>
                )}
            </div>
        </header>
    );
}
