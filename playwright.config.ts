import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL runs the suite against a deployment (a Vercel preview or
// production) instead of the local production server:
//   E2E_BASE_URL=https://<deployment> npx playwright test
// Specs that read build/ check the local build, so build the same commit.
const deployment = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: deployment ?? "http://127.0.0.1:3000",
    // Vercel injects its toolbar into preview deployments; its requests can
    // stall "networkidle". Production has no toolbar, so tests skip it.
    ...(deployment
      ? { extraHTTPHeaders: { "x-vercel-skip-toolbar": "1" } }
      : {}),
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: deployment
    ? undefined
    : {
        command: "npm run preview",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: false,
      },
});
