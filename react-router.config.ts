import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";
import { portfolio } from "./src/content/portfolio";

const fixedPaths = ["/", "/artist", "/search", "/library", "/liked"];

export const prerenderPaths = [
  ...fixedPaths,
  ...portfolio.collections.map(({ id }) => `/playlist/${id}`),
  ...portfolio.caseStudies.map(({ slug }) => `/case-studies/${slug}`),
];

export default {
  ssr: true,
  presets: [vercelPreset()],
  prerender: () => prerenderPaths,
  routeDiscovery: { mode: "initial" },
} satisfies Config;
