import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
import { CareerMixProvider } from "../../src/career-mix/CareerMixContext";
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
                CareerMixProvider,
                null,
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

  it("loads canonical collections and rejects unknown identifiers", () => {
    const achievements = loader(loaderArgs({ id: "achievements" }));
    expect(achievements).toMatchObject({
      kind: "collection",
      id: "achievements",
      title: "Achievements",
    });
    expect(meta({ data: achievements } as Parameters<typeof meta>[0])).toEqual(
      buildRouteMeta({
        kind: "collection",
        collection: collectionById("achievements")!,
      }),
    );
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
      await screen.findByRole("heading", { name: "Selected achievements" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Start Career Mix" }),
    ).toBeVisible();
  });

  it("renders canonical and compatibility collection branches", async () => {
    const view = renderCollectionRoute(
      "/playlist/achievements",
      "/playlist/:id",
    );
    expect(
      await screen.findByRole("heading", { name: "Achievements" }),
    ).toBeVisible();
    const firstAchievement = screen
      .getByRole("heading", {
        name: "National Business Plan Championship Finalist",
      })
      .closest("article");
    expect(firstAchievement).not.toBeNull();
    expect(
      within(firstAchievement!).getByRole("link", {
        name: "Read case study",
      }),
    ).toHaveAttribute(
      "href",
      "/case-studies/national-business-plan-championship-finalist",
    );

    view.unmount();
    renderCollectionRoute("/playlist/experience", "/playlist/:id");
    expect(
      await screen.findByRole("heading", { name: "Experience" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Start Career Mix" }),
    ).toBeVisible();
  });
});
