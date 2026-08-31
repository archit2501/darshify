import { configDefaults, defineConfig } from "vitest/config";
import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const designSystemCoverage = process.env.COVERAGE_SCOPE === "design-system";
const designSystemRuntime = [
  "src/lib/useReducedMotion.ts",
  "src/motion/MotionProvider.tsx",
  "src/shell/AppShell.tsx",
  "src/shell/MediaCard.tsx",
  "src/shell/PlayButton.tsx",
  "src/shell/PlayerBar.tsx",
  "src/shell/Sidebar.tsx",
  "src/shell/TopBar.tsx",
];

export default defineConfig({
  plugins: [tailwindcss(), ...(process.env.VITEST ? [react()] : reactRouter())],
  server: {
    watch: {
      ignored: ["**/.react-router/**", "**/.vercel/**", "**/build/**"],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: designSystemCoverage ? designSystemRuntime : undefined,
      thresholds: designSystemCoverage
        ? {
            statements: 90,
            branches: 90,
            functions: 90,
            lines: 90,
          }
        : undefined,
    },
  },
});
