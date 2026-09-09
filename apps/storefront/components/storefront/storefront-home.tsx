import type {
  PublicArticle,
  PublicProduct,
  PublicStorefront,
} from "@/types/storefront";
import { normalizeThemeConfig } from "@/lib/theme/theme-data";
import { ProductCard } from "@/components/storefront/product-card";
import { radiusValue } from "@/lib/theme/radius";

export function StorefrontHome({
  products,
  storefront,
}: {
  products: PublicProduct[];
  storefront: PublicStorefront;
}) {
  const config = normalizeThemeConfig(storefront.theme.config);
  const enabledSections = config.sections.filter((section) => section.enabled);

  return (
      <main>
        {enabledSections.map((section) => {
          switch (section.type) {
            case "hero":
              return config.layout.showHero ? (
                <Hero
                  config={config}
                  key={section.id}
                  merchantName={storefront.merchant.name}
                />
              ) : null;
            case "productGrid":
              return (
                <ProductGrid
                  config={config}
                  key={section.id}
                  merchant={storefront.merchant}
                  products={products}
                  title="Shop all"
                />
              );
            case "featuredCollection":
              return (
                <ProductGrid
                  config={config}
                  key={section.id}
                  merchant={storefront.merchant}
                  products={storefront.featuredProducts.slice(0, 6)}
                  title={config.featuredCollection.title}
                />
              );
            case "contactForm":
              return (
                <ContactSection
                  config={config}
                  email={storefront.merchant.email}
                  key={section.id}
                />
              );
            case "footer":
              return (
                <Footer
                  config={config}
                  key={section.id}
                  merchantName={storefront.merchant.name}
                />
              );
          }
        })}
      </main>
  );
}

function Hero({
  config,
  merchantName,
}: {
  config: ReturnType<typeof normalizeThemeConfig>;
  merchantName: string;
}) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-4 sm:px-8 sm:py-12">
      <div
        className="relative isolate flex min-h-[220px] items-end overflow-hidden px-5 py-6 sm:min-h-[520px] sm:px-12 sm:py-14"
        style={{
          backgroundColor: config.colors.primary,
          backgroundImage: config.hero.imageUrl
            ? `linear-gradient(90deg, rgb(0 0 0 / 70%), rgb(0 0 0 / 12%)), url("${config.hero.imageUrl}")`
            : `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.accent})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          borderRadius: radiusValue(config.layout.borderRadius),
          color: "#ffffff",
        }}
      >
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-75 sm:text-xs sm:tracking-[0.22em]">
            {merchantName}
          </p>
          <h1
            className="mt-2 text-2xl font-semibold tracking-tight sm:mt-4 sm:text-6xl"
            style={{
              fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
            }}
          >
            {config.hero.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 opacity-85 sm:mt-5 sm:text-lg sm:leading-7">
            {config.hero.subtitle}
          </p>
          <a
            className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-xs font-bold text-black sm:mt-8 sm:h-12 sm:px-6 sm:text-sm"
            href="#products"
          >
            Explore products
          </a>
        </div>
      </div>
    </section>
  );
}

function ProductGrid({
  config,
  merchant,
  products,
  title,
}: {
  config: ReturnType<typeof normalizeThemeConfig>;
  merchant: PublicStorefront["merchant"];
  products: PublicProduct[];
  title: string;
}) {
  return (
    <section className={spacingClass(config.layout.spacing)} id="products">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: config.colors.accent }}
            >
              Available now
            </p>
            <h2
              className="mt-2 text-3xl font-semibold tracking-tight"
              style={{
                fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
              }}
            >
              {title}
            </h2>
          </div>
          <p className="text-sm opacity-60">
            {products.length} product{products.length === 1 ? "" : "s"}
          </p>
        </div>
        {/* Desktop follows mobile: two products per row at every width. */}
        {products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {products.map((product) => (
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
            className="border px-6 py-16 text-center"
            style={{
              borderColor: `color-mix(in srgb, ${config.colors.text} 13%, transparent)`,
              borderRadius: radiusValue(config.layout.borderRadius),
            }}
          >
            <p className="font-semibold">The next collection is on its way</p>
            <p className="mt-2 text-sm opacity-60">
              There are no products published to this storefront right now.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ContactSection({
  config,
  email,
}: {
  config: ReturnType<typeof normalizeThemeConfig>;
  email: string | null;
}) {
  return (
    <section className={spacingClass(config.layout.spacing)}>
      <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
        <h2
          className="text-3xl font-semibold"
          style={{
            fontFamily: `${config.typography.headingFont}, ui-sans-serif, system-ui, sans-serif`,
          }}
        >
          {config.contactForm.title}
        </h2>
        <p className="mt-3 opacity-65">
          Questions about a product or your order? We would love to help.
        </p>
        {email && (
          <a
            className="mt-6 inline-flex h-11 items-center rounded-full px-5 text-sm font-bold text-white"
            href={`mailto:${email}`}
            style={{ backgroundColor: config.colors.primary }}
          >
            Email our store
          </a>
        )}
      </div>
    </section>
  );
}

function Footer({
  config,
  merchantName,
}: {
  config: ReturnType<typeof normalizeThemeConfig>;
  merchantName: string;
}) {
  return (
    <footer
      className="border-t px-5 py-10 text-center text-sm sm:px-8"
      style={{
        borderColor: `color-mix(in srgb, ${config.colors.text} 13%, transparent)`,
      }}
    >
      <p>{config.footer.text}</p>
      <p className="mt-2 text-xs opacity-50">© 2026 {merchantName}</p>
    </footer>
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

