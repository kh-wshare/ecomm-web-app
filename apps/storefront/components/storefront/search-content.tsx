"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

import type { PublicMerchant, PublicProduct } from "@/types/storefront";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";
import { ProductCard } from "@/components/storefront/product-card";

export function SearchContent({
  config,
  merchant,
  products,
}: {
  config: ReturnType<typeof normalizeThemeConfig>;
  merchant: PublicMerchant;
  products: PublicProduct[];
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        (product.description?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [products, query]);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-6 sm:px-8 sm:pt-8">
      <h1
        className="text-2xl font-semibold tracking-tight sm:text-3xl"
        style={{
          fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
        }}
      >
        Search products
      </h1>

      <div
        className="mt-5 flex items-center gap-2 rounded-2xl border px-4 py-3"
        style={{
          borderColor: `color-mix(in srgb, ${config.colors.text} 14%, transparent)`,
        }}
      >
        <Icon icon="solar:magnifer-linear" className="size-5 shrink-0 opacity-50" />
        <input
          autoFocus
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:opacity-50"
          placeholder="Search by product name or SKU"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button
            aria-label="Clear search"
            className="shrink-0"
            type="button"
            onClick={() => setQuery("")}
          >
            <Icon icon="solar:close-circle-linear" className="size-5 opacity-50" />
          </button>
        )}
      </div>

      <p className="mt-4 text-sm opacity-60">
        {results.length} result{results.length === 1 ? "" : "s"}
        {query ? ` for "${query}"` : ""}
      </p>

      {results.length ? (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {results.map((product) => (
            <ProductCard
              config={config}
              key={product.id}
              merchant={merchant}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div
          className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-16 text-center"
          style={{
            borderColor: `color-mix(in srgb, ${config.colors.text} 16%, transparent)`,
          }}
        >
          <Icon icon="solar:magnifer-linear" className="size-8 opacity-40" />
          <p className="font-semibold">No products found</p>
          <p className="text-sm opacity-60">Try a different search term.</p>
        </div>
      )}
    </main>
  );
}
