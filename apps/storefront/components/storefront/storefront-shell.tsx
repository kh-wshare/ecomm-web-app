"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { useOverlayState } from "@heroui/react";

import type { PublicMerchant } from "@/types/storefront";
import type { ThemeConfig } from "@/types/theme";
import { StorefrontCustomerAuth } from "@/components/storefront/storefront-customer-auth";
import { CartModal } from "@/components/storefront/cart-modal";
import { ProfileItemHeaderTitle } from "@/components/storefront/profile-item-header-title";
import { useCart } from "@/lib/cart/use-cart";
import { formatCurrency } from "@/lib/formatters/currency";

type StorefrontStyle = CSSProperties & {
  "--store-accent": string;
  "--store-background": string;
  "--store-primary": string;
  "--store-text": string;
};

export function StorefrontShell({
  children,
  config,
  merchant,
}: {
  children: React.ReactNode;
  config: ThemeConfig;
  merchant: PublicMerchant;
}) {
  const basePath = `/${merchant.slug}`;
  const pathname = usePathname();
  const isHomeActive = pathname === basePath;
  const isSearchActive = Boolean(pathname?.startsWith(`${basePath}/search`));
  const isOrdersActive = Boolean(pathname?.startsWith(`${basePath}/orders`));
  const isProfileRoute = Boolean(pathname?.startsWith(`${basePath}/profile`));
  const isProfileItemRoute = Boolean(pathname?.startsWith(`${basePath}/profile/`));
  const isCartRoute = Boolean(pathname?.startsWith(`${basePath}/cart`));
  const { cart, itemCount } = useCart(merchant.slug);
  const cartCurrency = cart.items[0]?.currency ?? "USD";
  const cartSubtotal = cart.items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );
  const showCartRow = itemCount > 0 && !isProfileRoute && !isCartRoute;
  const cartModal = useOverlayState({ defaultOpen: false });
  const activeNavIndex = isHomeActive ? 0 : isSearchActive ? 1 : isOrdersActive ? 2 : -1;

  const style: StorefrontStyle = {
    "--store-accent": config.colors.accent,
    "--store-background": config.colors.background,
    "--store-primary": config.colors.primary,
    "--store-text": config.colors.text,
    backgroundColor: config.colors.background,
    color: config.colors.text,
    fontFamily: `${config.typography.bodyFont}, ui-sans-serif, system-ui, sans-serif`,
  };

  return (
    <div className="min-h-dvh pb-16" style={style}>
      {/* Header — main storefront nav, or the profile item variant on /profile/* sub-pages */}
      <ProfileItemHeaderTitle
        config={config}
        isGlobal={!isProfileItemRoute}
        merchant={merchant}
      />

      {children}

      <CartModal config={config} merchant={merchant} state={cartModal} />

      {/* Bottom Bar — cart summary + navigation, unified in one card at every width */}
      <nav className="fixed inset-x-0 bottom-0 z-40">
        <div className="storefront-bottom-bar mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div
            className="overflow-hidden rounded-[1.75rem] shadow-[0_-8px_30px_-4px_rgba(0,0,0,0.12)] backdrop-blur-xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${config.colors.background} 78%, transparent)`,
              border: `1px solid color-mix(in srgb, ${config.colors.text} 10%, transparent)`,
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
            }}
          >
            {/* Cart summary row — only when the cart has items */}
            {showCartRow && (
              <button
                aria-label={`View cart, ${itemCount} item${itemCount === 1 ? "" : "s"}, ${formatCurrency(cartSubtotal, cartCurrency)}`}
                className="storefront-cart-bar flex w-full items-center gap-3 px-4 py-3 transition-transform active:scale-[0.98]"
                style={{ backgroundColor: config.colors.primary }}
                type="button"
                onClick={cartModal.open}
              >
                <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon icon="solar:cart-large-2-bold" className="size-4 text-white" />
                  <span
                    className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-white px-1 text-[9px] font-bold leading-4"
                    style={{ color: config.colors.primary }}
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                </span>
                <span className="min-w-0 flex-1 text-left text-white">
                  <span className="block text-[10px] font-medium leading-tight text-white/80">
                    View cart
                  </span>
                  <span className="block truncate text-sm font-bold leading-tight">
                    {formatCurrency(cartSubtotal, cartCurrency)}
                  </span>
                </span>
                <Icon icon="solar:alt-arrow-right-linear" className="size-4 shrink-0 text-white/85" />
              </button>
            )}

            <div className="flex h-16 items-center">
              {/* Main Navigation */}
              <div className="relative flex flex-1 items-center h-full">
                {/* Liquid glass indicator — slides beneath the active tab */}
                <div
                  className="absolute inset-y-2 left-0 z-0 rounded-full transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{
                    width: "33.3333%",
                    transform: `translateX(${Math.max(activeNavIndex, 0) * 100}%)`,
                    opacity: activeNavIndex === -1 ? 0 : 1,
                    background:
                      "linear-gradient(180deg, color-mix(in srgb, white 50%, transparent), color-mix(in srgb, white 12%, transparent))",
                    backdropFilter: "blur(14px) saturate(180%)",
                    WebkitBackdropFilter: "blur(14px) saturate(180%)",
                    border: "1px solid color-mix(in srgb, white 45%, transparent)",
                    boxShadow: "0 0 12px color-mix(in srgb, white 40%, transparent)",
                  }}
                />

                {/* Home */}
                <Link
                  href={basePath}
                  key={basePath}
                  className="group relative z-10 flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-transform duration-200 ease-out active:scale-90"
                  style={{ color: isHomeActive ? config.colors.accent : undefined }}
                >
                  <Icon
                    icon="solar:home-2-linear"
                    className="size-5 transition-transform duration-200 ease-out group-active:scale-90"
                    style={{ transform: isHomeActive ? "scale(1.12)" : undefined }}
                  />
                  <span className="transition-colors duration-200">Home</span>
                </Link>

                {/* Search */}
                <Link
                  href={`${basePath}/search`}
                  key={`${basePath}/search`}
                  className="group relative z-10 flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-transform duration-200 ease-out active:scale-90"
                  style={{ color: isSearchActive ? config.colors.accent : undefined }}
                >
                  <Icon
                    icon="solar:magnifer-linear"
                    className="size-5 transition-transform duration-200 ease-out group-active:scale-90"
                    style={{ transform: isSearchActive ? "scale(1.12)" : undefined }}
                  />
                  <span className="transition-colors duration-200">Search</span>
                </Link>

                {/* Orders */}
                <Link
                  href={`${basePath}/orders`}
                  key={`${basePath}/orders`}
                  className="group relative z-10 flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-transform duration-200 ease-out active:scale-90"
                  style={{ color: isOrdersActive ? config.colors.accent : undefined }}
                >
                  <Icon
                    icon="solar:bag-4-outline"
                    className="size-5 transition-transform duration-200 ease-out group-active:scale-90"
                    style={{ transform: isOrdersActive ? "scale(1.12)" : undefined }}
                  />
                  <span className="transition-colors duration-200">Orders</span>
                </Link>
              </div>

              {/* Account */}
              <div className="px-4 h-full flex shrink-0 items-center justify-center">
                <div className="flex size-14 items-center justify-center rounded-full transition-transform duration-200 ease-out active:scale-90">
                  <StorefrontCustomerAuth slug={merchant.slug} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

