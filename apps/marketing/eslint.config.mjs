import nextConfig from "@repo/eslint-config/next";
import { appBoundaries } from "@repo/eslint-config/app-boundaries";

const marketingConfig = [...nextConfig, appBoundaries("marketing")];

export default marketingConfig;
