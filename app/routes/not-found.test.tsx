import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import NotFoundRoute, { loader, meta, NotFoundView } from "./not-found";
import { buildNotFoundMeta } from "../../src/seo/meta";

describe("not-found route", () => {
  it("returns HTTP 404 metadata and renders the shared recovery view", () => {
    expect(loader()).toMatchObject({ data: null, init: { status: 404 } });
    expect(meta({} as Parameters<typeof meta>[0])).toEqual(
      buildNotFoundMeta(
        "The requested Darshify portfolio page could not be found.",
      ),
    );

    const view = render(
      <MemoryRouter>
        <NotFoundView />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Browse Projects" }),
    ).toHaveAttribute("href", "/playlist/projects");

    view.rerender(
      <MemoryRouter>
        <NotFoundRoute />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
