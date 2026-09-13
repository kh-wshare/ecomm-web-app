import importPlugin from "eslint-plugin-import";

// Keep in sync with the `apps/*` directory and the ports table in
// docs/architecture.md.
const ALL_APPS = ["marketing", "merchant", "storefront"];

/**
 * Flat-config block that fails lint if the given app imports source from any
 * other app. Codifies the "apps must not import source directly from
 * another app" rule in docs/architecture.md — shared code belongs in
 * `packages/*` instead.
 */
export function appBoundaries(currentApp) {
  if (!ALL_APPS.includes(currentApp)) {
    throw new Error(
      `appBoundaries: unknown app "${currentApp}", expected one of ${ALL_APPS.join(", ")}`,
    );
  }

  return {
    plugins: { import: importPlugin },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: ALL_APPS.filter((app) => app !== currentApp).map((app) => ({
            target: "./",
            from: `../${app}`,
            message: `Apps must not import source directly from another app ("${app}"). Move shared code to packages/* instead. See docs/architecture.md.`,
          })),
        },
      ],
    },
  };
}
