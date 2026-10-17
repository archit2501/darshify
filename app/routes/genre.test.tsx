import { createElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
  type LoaderFunctionArgs,
} from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../../src/content/portfolio";
import { PlayerProvider } from "../../src/player/PlayerProvider";
import { buildNotFoundMeta, buildRouteMeta } from "../../src/seo/meta";
import { ToastProvider } from "../../src/shell/Toast";
import GenreRoute, { loader, meta } from "./genre";

const args = (slug: string) =>
  ({
    params: { slug },
    request: new Request(`https://darshify.test/genre/${slug}`),
  }) as unknown as LoaderFunctionArgs;

function renderGenre(slug: string) {
  const path = `/genre/${slug}`;
  const router = createMemoryRouter(
    [
      {
        path: "/genre/:slug",
        loader,
        element: createElement(
          PlayerProvider,
          { createAudio: () => null, children: null },
          createElement(ToastProvider, null, createElement(GenreRoute)),
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

const strategic = portfolio.genres.find(
  (genre) => genre.slug === "strategic-analysis",
)!;

describe("skill (genre) pages", () => {
  it("loads every skill with its own metadata, and 404s anything else", () => {
    for (const genre of portfolio.genres) {
      const loaded = loader(args(genre.slug));
      expect(loaded).toBe(genre);
      expect(meta({ data: loaded } as Parameters<typeof meta>[0])).toEqual(
        buildRouteMeta({ kind: "genre", genre }),
      );
    }
    expect(loader(args("not-a-skill"))).toMatchObject({
      data: null,
      init: { status: 404 },
    });
    expect(meta({ data: null } as Parameters<typeof meta>[0])).toEqual(
      buildNotFoundMeta("The requested Darshify skill could not be found."),
    );
    const [title] = buildRouteMeta({ kind: "genre", genre: strategic });
    expect(title).toEqual({
      title: "Strategic Analysis — Darshil Jain | Darshify",
    });
  });

  it("lists every song that uses the skill and plays them", async () => {
    renderGenre(strategic.slug);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Strategic Analysis",
      }),
    ).toBeVisible();
    const songs = portfolio.caseStudies.filter((item) =>
      item.skills.includes("Strategic Analysis"),
    );
    const table = screen.getByRole("table", {
      name: "Songs that use Strategic Analysis",
    });
    expect(within(table).getAllByRole("row")).toHaveLength(songs.length + 1);
    fireEvent.click(
      screen.getByRole("button", { name: "Play Strategic Analysis" }),
    );
    expect(
      screen.getByRole("button", { name: "Pause Strategic Analysis" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "More skills" }),
    ).toBeInTheDocument();
  });

  it("says plainly when the résumé ties a skill to no single role", async () => {
    const unused = portfolio.genres.find(
      (genre) =>
        !portfolio.caseStudies.some((item) =>
          item.skills.includes(genre.skill),
        ),
    );
    if (!unused) return;
    renderGenre(unused.slug);
    expect(
      await screen.findByText(/without tying it to one role or project/),
    ).toBeVisible();
  });
});
