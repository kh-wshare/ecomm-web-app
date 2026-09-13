import config from "@repo/eslint-config/next";
import { appBoundaries } from "@repo/eslint-config/app-boundaries";

const merchantConfig = [...config, appBoundaries("merchant")];

export default merchantConfig;
