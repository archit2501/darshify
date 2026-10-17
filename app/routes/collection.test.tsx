import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryRouter,
  RouterProvider,
  type LoaderFunctionArgs,
} from "react-router";
import {
  MemoryRouter as DomMemoryRouter,
  Route as DomRoute,
  Routes as DomRoutes,
} from "react-router-dom";
import { PlayerProvider } from "../../src/player/PlayerProvider";
import { collectionById } from "../../src/content/selectors";
import { buildNotFoundMeta, buildRouteMeta } from "../../src/seo/meta";
import { ToastProvider } from "../../src/shell/Toast";
import CollectionRoute, { loader, meta } from "./collection";

const loaderArgs = (params: Record<string, string | undefined>) =>
  ({
    params,
    request: new Request("https://darshify.test/collection"),
  }) as LoaderFunctionArgs;

function renderCollectionRoute(path: string, routePath: string) {
  const router = createMemoryRouter(
    [
      {
        path: routePath,
        loader,
        element: createElement(
          DomMemoryRouter,
          { initialEntries: [path] },
          createElement(
            DomRoutes,
            null,
            createElement(DomRoute, {
              path: routePath,
              element: createElement(
                PlayerProvider,
                { createAudio: () => null, children: null },
                createElement(
                  ToastProvider,
                  null,
                  createElement(CollectionRoute),
                ),
              ),
            }),
          ),
        ),
      },
    ],
    { initialEntries: [path] },
  );
  return render(createElement(RouterProvider, { router }));
}

beforeEach(() =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
);
afterEach(() => vi.unstubAllGlobals());

describe("collection route", () => {
  it("keeps the liked alias identity while returning truthful metadata", () => {
    const result = loader(loaderArgs({}));

    expect(result).toMatchObject({
      kind: "liked",
      title: "Selected achievements",
      description: expect.stringContaining("achievements"),
    });
    expect(meta({ data: result } as Parameters<typeof meta>[0])).toEqual(
      buildRouteMeta({ kind: "liked" }),
    );
  });

  it("loads canonical collections, redirects the awards to /liked and rejects unknown identifiers", () => {
    const experience = loader(loaderArgs({ id: "experience" }));
    expect(experience).toMatchObject({
      kind: "collection",
      id: "experience",
      title: "Experience",
    });
    expect(meta({ data: experience } as Parameters<typeof meta>[0])).toEqual(
      buildRouteMeta({
        kind: "collection",
        collection: collectionById("experience")!,
      }),
    );

    let redirected: unknown;
    try {
      loader(loaderArgs({ id: "achievements" }));
    } catch (thrown) {
      redirected = thrown;
    }
    expect(redirected).toBeInstanceOf(Response);
    expect((redirected as Response).status).toBe(301);
    expect((redirected as Response).headers.get("Location")).toBe("/liked");

    expect(loader(loaderArgs({ id: "missing" }))).toMatchObject({
      data: null,
      init: { status: 404 },
    });
    expect(meta({ data: null } as Parameters<typeof meta>[0])).toEqual(
      buildNotFoundMeta(
        "The requested portfolio collection could not be found.",
      ),
    );
  });

  it("renders the liked alias through the real route and providers", async () => {
    renderCollectionRoute("/liked", "/liked");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Selected achievements",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Play Selected achievements" }),
    ).toBeVisible();
  });

  it("renders a release with its track list", async () => {
    renderCollectionRoute("/playlist/experience", "/playlist/:id");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Experience" }),
    ).toBeVisible();
    const table = screen.getByRole("table", { name: "Experience songs" });
    expect(
      within(table).getByRole("link", {
        name: "Operations Intern at Figmenta",
      }),
    ).toHaveAttribute("href", "/case-studies/figmenta-operations-intern");
    expect(
      screen.getByRole("button", { name: "Play Experience" }),
    ).toBeVisible();
  });
});
