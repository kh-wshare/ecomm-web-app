"use client";

import { useEffect, useState } from "react";

/**
 * True only after the first client-side render has committed. Use this to
 * gate any branch that depends on client-only state (query results, cookies,
 * localStorage, etc.) that can resolve faster than hydration completes —
 * otherwise the server's necessarily-pending render and the client's
 * already-resolved render can disagree, which React reports as a hydration
 * mismatch.
 */
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
