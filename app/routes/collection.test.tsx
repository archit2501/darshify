import { createElement } from "react";
import { render, screen } from "@testing-library/react";
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
    expect(meta({ data: result } as Parameters<typeof meta>[0])).toEqual([
      { title: "Selected achievements | Darshify" },
      {
        name: "description",
        content:
          "Darshil Jain's selected achievements and competition recognition.",
      },
    ]);
  });

  it("loads canonical collections and rejects unknown identifiers", () => {
    expect(loader(loaderArgs({ id: "achievements" }))).toMatchObject({
      kind: "collection",
      id: "achievements",
      title: "Achievements",
    });
    expect(loader(loaderArgs({ id: "missing" }))).toMatchObject({
      data: null,
      init: { status: 404 },
    });
    expect(meta({ data: null } as Parameters<typeof meta>[0])).toEqual([
      { title: "Page not found | Darshify" },
      {
        name: "description",
        content: "The requested portfolio collection could not be found.",
      },
    ]);
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
    expect(
      screen.getByRole("link", {
        name: "National Business Plan Championship Finalist",
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
