// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://wrapped-portfolio.vercel.app/case-studies/figmenta-operations-intern"}

import type { ReactNode } from "react";
import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({
  enabled: true,
  events: [] as string[],
  initializations: 0,
}));

vi.mock("@vercel/analytics/react", async () => {
  const { useEffect } = await import("react");
  return {
    Analytics: () => {
      useEffect(() => {
        runtime.initializations += 1;
        (window as typeof window & { va?: (...args: unknown[]) => void }).va = (
          _type,
          payload,
        ) => {
          const name = (payload as { name?: string } | undefined)?.name;
          if (name) runtime.events.push(name);
        };
      }, []);
      return null;
    },
  };
});

vi.mock("../src/analytics/outcomes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/analytics/outcomes")>();
  return {
    ...actual,
    shouldEnableAnalytics: (hostname: string) =>
      runtime.enabled && actual.shouldEnableAnalytics(hostname),
  };
});

vi.mock("../src/shell/AppShell", async () => {
  const { useEffect } = await import("react");
  return {
    AppShell: () => {
      useEffect(() => {
        (window as typeof window & { va?: (...args: unknown[]) => void }).va?.(
          "event",
          { name: "case_study_open" },
        );
      }, []);
      return <main>Case study</main>;
    },
  };
});

vi.mock("../src/career-mix/CareerMixContext", () => ({
  CareerMixProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../src/shell/Toast", () => ({
  ToastProvider: ({ children }: { children: ReactNode }) => children,
}));

import Root from "./root";

describe("production analytics sequencing", () => {
  beforeEach(() => {
    runtime.enabled = true;
    runtime.events = [];
    runtime.initializations = 0;
    delete (window as typeof window & { va?: (...args: unknown[]) => void }).va;
  });

  afterEach(() => vi.unstubAllGlobals());

  it("initializes the official queue before a direct case-study landing tracks exactly once", async () => {
    const view = render(<Root />);

    await act(async () => undefined);
    expect(runtime.initializations).toBe(1);
    expect(runtime.events).toEqual(["case_study_open"]);

    view.rerender(<Root />);
    await act(async () => undefined);
    expect(runtime.initializations).toBe(1);
    expect(runtime.events).toEqual(["case_study_open"]);
  });

  it("does not initialize or record when the production gate is disabled", async () => {
    runtime.enabled = false;
    render(<Root />);

    await act(async () => undefined);
    expect(runtime.initializations).toBe(0);
    expect(runtime.events).toEqual([]);
  });

  it("renders no analytics runtime during SSR", () => {
    vi.stubGlobal("window", undefined);
    expect(renderToString(<Root />)).toContain("Case study");
    expect(runtime.initializations).toBe(0);
    expect(runtime.events).toEqual([]);
  });
});
