import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { releaseArt, songArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import { lengthLabel, startLabel } from "../content/songFacts";
import { PlayerProvider } from "../player/PlayerProvider";
import { createPlayerStore, type PlayerStore } from "../player/store";
import { releaseContext } from "../player/tracks";
import { ToastProvider } from "../shell/Toast";
import { formatListLength } from "../shell/time";
import { ActionBar } from "./ActionBar";
import { MediaCard } from "./MediaCard";
import { ReleaseBody, ReleaseHeader } from "./ReleaseHeader";
import { Shelf } from "./Shelf";
import { titleSizeClass } from "./titleSize";
import { TrackTable } from "./TrackTable";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const experience = portfolio.collections.find(
  (item) => item.id === "experience",
)!;
const context = releaseContext(experience);
const songs = experience.caseStudyIds.map((id) =>
  portfolio.caseStudies.find((song) => song.id === id)!,
);

function renderWith(ui: ReactNode, store?: PlayerStore) {
  const player = store ?? createPlayerStore({ clock: () => 0 });
  render(
    <PlayerProvider store={player} createAudio={() => null}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </PlayerProvider>,
  );
  return player;
}

describe("MediaCard", () => {
  it("is one stretched link with a separate play button that stays up while its list plays", () => {
    const store = renderWith(
      <MediaCard
        href="/playlist/experience"
        title="Experience"
        subtitle="Three internships"
        art={releaseArt(experience)}
        play={{ context }}
        menu={{ kind: "release", id: "experience" }}
      />,
    );
    const card = screen.getByRole("article");
    const link = within(card).getByRole("link", { name: "Experience" });
    expect(link).toHaveAttribute("href", "/playlist/experience");
    expect(within(card).getAllByRole("link")).toHaveLength(1);
    const play = within(card).getByRole("button", { name: "Play Experience" });
    expect(link).not.toContainElement(play);
    expect(play.parentElement).toHaveAttribute("data-active", "false");

    fireEvent.click(play);
    expect(store.getState().context.id).toBe(context.id);
    expect(
      within(card).getByRole("button", { name: "Pause Experience" })
        .parentElement,
    ).toHaveAttribute("data-active", "true");
  });

  it("offers the item's menu on right-click and plain cards without play", async () => {
    const song = songs[0]!;
    renderWith(
      <>
        <MediaCard
          href={`/case-studies/${song.slug}`}
          title={song.title}
          art={songArt(song)}
          menu={{ kind: "song", id: song.id }}
        />
        <MediaCard
          href="/artist"
          title="Darshil Jain"
          subtitle="Artist"
          art={releaseArt(experience)}
          round
        />
      </>,
    );
    const [songCard, artistCard] = screen.getAllByRole("article");
    expect(within(songCard!).queryByRole("button")).not.toBeInTheDocument();
    fireEvent.contextMenu(songCard!);
    expect(
      await screen.findByRole("menuitem", { name: "View credits" }),
    ).toBeVisible();
    expect(artistCard!.querySelector("[data-cover]")).toHaveClass(
      "rounded-full",
    );
  });
});

describe("Shelf", () => {
  it("heads a row of cards with Show all and pages with the chevrons", () => {
    let report: (() => void) | undefined;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          report = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    renderWith(
      <Shelf title="Releases" href="/library">
        <div>One</div>
        <div>Two</div>
      </Shelf>,
    );
    const shelf = screen.getByRole("region", { name: "Releases" });
    expect(
      within(shelf).getByRole("link", { name: "Show all: Releases" }),
    ).toHaveAttribute("href", "/library");
    const row = shelf.querySelector<HTMLElement>(".snap-x")!;
    Object.defineProperties(row, {
      clientWidth: { value: 500, configurable: true },
      scrollWidth: { value: 1200, configurable: true },
      scrollLeft: { value: 0, writable: true, configurable: true },
    });
    const scrollBy = vi.fn();
    row.scrollBy = scrollBy;
    act(() => report?.());

    const [back, forward] =
      shelf.querySelectorAll<HTMLButtonElement>("button[data-side]");
    expect(back).toHaveClass("pointer-events-none");
    expect(forward).not.toHaveClass("pointer-events-none");
    fireEvent.click(forward!);
    expect(scrollBy).toHaveBeenCalledWith({ left: 400, behavior: "smooth" });

    row.scrollLeft = 700;
    fireEvent.scroll(row);
    expect(back).not.toHaveClass("pointer-events-none");
    expect(forward).toHaveClass("pointer-events-none");
    fireEvent.click(back!);
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: -400,
      behavior: "smooth",
    });
  });

  it("works without a Show all page", () => {
    renderWith(
      <Shelf title="Plain">
        <div>One</div>
      </Shelf>,
    );
    const shelf = screen.getByRole("region", { name: "Plain" });
    expect(within(shelf).queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("TrackTable", () => {
  it("lays out honest columns and turns the number into play", () => {
    const store = renderWith(
      <TrackTable songs={songs} context={context} label="Experience songs" />,
    );
    const table = screen.getByRole("table", { name: "Experience songs" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["#", "Title", "Impact", "Started", "Length", "More options"]);
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(songs.length);

    const first = songs[0]!;
    const cells = within(rows[0]!).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("1");
    expect(
      within(cells[1]!).getByRole("link", { name: first.title }),
    ).toHaveAttribute("href", `/case-studies/${first.slug}`);
    expect(cells[3]).toHaveTextContent(startLabel(first) ?? "—");
    expect(cells[4]).toHaveTextContent(lengthLabel(first) ?? "—");

    fireEvent.click(
      within(rows[1]!).getByRole("button", { name: `Play ${songs[1]!.title}` }),
    );
    expect(store.getState().currentId).toBe(songs[1]!.id);
    expect(rows[1]).toHaveAttribute("aria-current", "true");
    expect(within(rows[1]!).getByText("Now playing")).toBeInTheDocument();
    fireEvent.click(
      within(rows[1]!).getByRole("button", {
        name: `Pause ${songs[1]!.title}`,
      }),
    );
    expect(store.getState().status).toBe("paused");
    expect(rows[1]).toHaveAttribute("aria-current", "true");
    expect(within(rows[1]!).queryByText("Now playing")).not.toBeInTheDocument();
  });

  it("gives each row the song's menu, by button and right-click", async () => {
    const store = renderWith(
      <TrackTable
        songs={songs}
        context={context}
        label="Experience songs"
        showCover={false}
      />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]!.querySelector("[data-cover]")).toBeNull();
    fireEvent.contextMenu(rows[2]!);
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Add to queue" }),
    );
    expect(store.getState().queue).toEqual([songs[2]!.id]);
    expect(
      within(rows[0]!).getByRole("button", {
        name: `More options for ${songs[0]!.title}`,
      }),
    ).toBeInTheDocument();
  });

  it("marks a missing fact rather than leaving a blank", () => {
    const loose = { ...songs[0]!, featuredProofId: null, start: undefined };
    renderWith(<TrackTable songs={[loose]} context={context} label="Loose" />);
    const cells = within(screen.getAllByRole("row")[1]!).getAllByRole("cell");
    expect(within(cells[2]!).getByLabelText("None listed")).toHaveTextContent(
      "—",
    );
    expect(within(cells[3]!).getByLabelText("Not listed")).toHaveTextContent(
      "—",
    );
  });
});

describe("ReleaseHeader", () => {
  it("names the release, its type and the facts after the artist", () => {
    renderWith(
      <>
        <ReleaseHeader
          type="EP"
          title="Experience"
          description="Three internships"
          art={releaseArt(experience)}
          meta={["2025–2026", "3 songs, 1 min 40 sec"]}
        />
        <ReleaseBody color={experience.color}>
          <p>Body</p>
        </ReleaseBody>
      </>,
    );
    const header = screen.getByRole("banner");
    expect(
      within(header).getByRole("heading", { level: 1, name: "Experience" }),
    ).toHaveClass("text-display");
    expect(within(header).getAllByText("EP")[0]).toBeInTheDocument();
    expect(within(header).getByText("Three internships")).toBeVisible();
    expect(
      within(header).getByRole("link", { name: "Darshil Jain" }),
    ).toHaveAttribute("href", "/artist");
    expect(header).toHaveTextContent("· 2025–2026");
    expect(header).toHaveTextContent("· 3 songs, 1 min 40 sec");
    expect(screen.getByText("Body")).toBeVisible();
  });

  it("steps long titles down so they fit", () => {
    expect(titleSizeClass("Experience")).toBe("text-display");
    expect(titleSizeClass("Operations Intern at Figmenta")).toContain(
      "text-[clamp(1.5rem",
    );
    expect(titleSizeClass("Selected achievements")).toContain(
      "text-[clamp(1.75rem",
    );
  });
});

describe("ActionBar", () => {
  it("plays this list, shuffles, saves it and offers the CV", () => {
    const store = renderWith(
      <ActionBar
        context={context}
        label="Experience"
        saveId="experience"
        menu={<button type="button">More</button>}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Play Experience" }));
    expect(store.getState().context.id).toBe(context.id);
    fireEvent.click(screen.getByRole("button", { name: "Enable shuffle" }));
    expect(store.getState().shuffle).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Save Experience to Your Library" }),
    );
    expect(store.getState().saved).toContain("experience");
    expect(
      screen.getByRole("status", { name: "Notifications" }),
    ).toHaveTextContent("Saved to Your Library");
    expect(
      screen.getByRole("button", {
        name: "Remove Experience from Your Library",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("link", { name: "Download Darshil's CV" }),
    ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });

  it("leaves Save out when there is nothing to save", () => {
    renderWith(<ActionBar context={context} label="Experience" />);
    expect(
      screen.queryByRole("button", { name: /Your Library/ }),
    ).not.toBeInTheDocument();
  });
});

describe("list length", () => {
  it("reads like the app's release headers", () => {
    expect(formatListLength(34_000)).toBe("34 sec");
    expect(formatListLength(94_400)).toBe("1 min 34 sec");
    expect(formatListLength(120_000)).toBe("2 min");
  });
});
