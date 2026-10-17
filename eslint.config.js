import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    ".react-router",
    ".vercel",
    "build",
    "dist",
    "coverage",
    "playwright-report",
    "test-results",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-router-dom",
              message:
                "Import from react-router. react-router-dom pulls react-router/dom into the server function, which Vercel's file tracing leaves out (FUNCTION_INVOCATION_FAILED on every server-rendered request).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": [
        "error",
        { allowExportNames: ["action", "headers", "links", "loader", "meta"] },
      ],
    },
  },
]);
