import { configDefaults, defineConfig } from "vitest/config";
import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const coverageScope = process.env.COVERAGE_SCOPE;
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
const semanticShellRuntime = [
  "src/components/ContactActions.tsx",
  "src/icons/icons.tsx",
  "src/pages/ArtistPage.tsx",
  "src/pages/Home.tsx",
  "src/shell/BottomNav.tsx",
  "src/shell/RouteFocus.tsx",
  "src/shell/SkipLink.tsx",
];
const cumulativeRedesignRuntime = [
  ...designSystemRuntime,
  ...semanticShellRuntime,
  "src/components/EvidenceCover.tsx",
  "src/components/ProofWaveform.tsx",
  "src/content/artifactFallback.ts",
  "src/content/portfolio.ts",
  "src/content/waveform.ts",
  "src/data/library.ts",
  "src/shell/Art.tsx",
];
const coverageRuntime =
  coverageScope === "redesign"
    ? cumulativeRedesignRuntime
    : coverageScope === "design-system"
      ? designSystemRuntime
      : undefined;

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
      include: coverageRuntime,
      thresholds: coverageRuntime
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
