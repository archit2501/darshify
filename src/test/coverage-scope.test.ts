// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

const taskRuntimeModules = [
  "app/routes/home.tsx",
  "src/components/ProofWaveform.tsx",
  "src/components/RecruiterHero.tsx",
  "src/content/portfolio.ts",
  "src/content/selectors.ts",
  "src/content/validate.ts",
  "src/content/waveform.ts",
  "src/pages/Home.tsx",
  "src/shell/MediaCard.tsx",
  "src/shell/Shelf.tsx",
  "src/shell/Sidebar.tsx",
  "src/shell/TopBar.tsx",
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("cumulative redesign coverage", () => {
  // Regression: a changed runtime module can otherwise disappear from enforcement while the aggregate gate still stays above 90%.
  it("includes every executable module changed by the recruiter Home task", async () => {
    vi.stubEnv("COVERAGE_SCOPE", "redesign");
    vi.stubEnv("VITEST", "true");
    vi.resetModules();

    const { default: config } = await import("../../vite.config");
    const include = (
      config as {
        test?: { coverage?: { include?: string[] } };
      }
    ).test?.coverage?.include;

    expect(include).toEqual(expect.arrayContaining(taskRuntimeModules));
  });
});
