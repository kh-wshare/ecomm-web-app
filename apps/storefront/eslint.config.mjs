import config from "@repo/eslint-config/next";
import { appBoundaries } from "@repo/eslint-config/app-boundaries";

const storefrontConfig = [...config, appBoundaries("storefront")];

export default storefrontConfig;
