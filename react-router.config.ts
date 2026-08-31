import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";
import { canonicalRouteInventory } from "./src/seo/meta";

export const prerenderPaths = canonicalRouteInventory.map(({ path }) => path);

export default {
  ssr: true,
  presets: [vercelPreset()],
  prerender: () => prerenderPaths,
  routeDiscovery: { mode: "initial" },
} satisfies Config;
