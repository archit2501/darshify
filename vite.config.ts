import { configDefaults, defineConfig } from "vitest/config";
import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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
    },
  },
});
