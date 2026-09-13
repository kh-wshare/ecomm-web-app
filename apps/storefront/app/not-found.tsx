import Link from "next/link";

// Root-level: Next.js renders the nearest *parent* not-found.tsx when
// notFound() is thrown from a layout (e.g. [merchantSlug]/layout.tsx
// fetching a storefront that doesn't exist) — a same-directory
// [merchantSlug]/not-found.tsx would not catch that case, so this lives here.
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center text-foreground">
      <div className="max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
          Store not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          We could not find this storefront
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Double-check the link, or the store may no longer be available.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link
            className="rounded-full border border-separator px-5 py-2.5 text-sm font-semibold"
            href="/"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
