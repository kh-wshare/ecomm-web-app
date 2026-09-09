export default function StorefrontLoading() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="h-18 animate-pulse border-b border-separator bg-surface" />
      <div className="mx-auto max-w-2xl space-y-10 px-5 py-8 sm:px-8">
        <div className="h-[520px] animate-pulse rounded-3xl bg-surface-secondary" />
        <div className="h-9 w-56 animate-pulse rounded-lg bg-surface-secondary" />
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              className="h-96 animate-pulse rounded-2xl bg-surface-secondary"
              key={index}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
