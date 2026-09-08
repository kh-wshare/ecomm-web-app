import type { ThemeConfig } from "@/types/theme";

export function radiusValue(radius: ThemeConfig["layout"]["borderRadius"]) {
  return {
    none: "0",
    small: "0.5rem",
    medium: "1rem",
    large: "1.75rem",
  }[radius];
}
