import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import { PlayerProvider } from "../player/PlayerProvider";
import { createPlayerStore } from "../player/store";
import { releaseContext, songContext, trackById } from "../player/tracks";
import { caseStudyById } from "../content/selectors";
import { absoluteUrl } from "../seo/site";
import { ReleaseContextMenu, ReleaseMenu } from "./ReleaseMenu";
import { SongContextMenu, SongMenu } from "./SongMenu";
import { ToastProvider } from "./Toast";

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

function setClipboard(value: unknown) {
  Object.defineProperty(window.navigator, "clipboard", {
    value,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window.navigator, "clipboard");
});

const SONG = "r2";
const experience = portfolio.collections.find(
  (item) => item.id === "experience",
)!;

function setup() {
  const store = createPlayerStore({ clock: () => 0 });
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <ul>
            <SongContextMenu songId={SONG} render={<li />}>
              Song row
            </SongContextMenu>
            <li>
              <SongMenu songId={SONG} />
            </li>
            <ReleaseContextMenu releaseId="experience" render={<li />}>
              Release row
            </ReleaseContextMenu>
            <li>
              <ReleaseMenu releaseId="experience" />
            </li>
          </ul>
        ),
      },
    ],
    { initialEntries: ["/"] },
  );
  render(
    <PlayerProvider store={store} createAudio={() => null}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </PlayerProvider>,
  );
  return { store, router };
}

const status = () => screen.getByRole("status", { name: "Notifications" });
const song = trackById(SONG)!;

async function openSongMenu() {
  fireEvent.click(
    screen.getByRole("button", { name: `More options for ${song.title}` }),
  );
  return screen.findByRole("menu");
}

describe("song menus", () => {
  it("plays, queues and saves, saying what happened", async () => {
    const { store } = setup();
    let menu = await openSongMenu();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Play" }));
    expect(store.getState().currentId).toBe(SONG);
    expect(store.getState().context.id).toBe(
      songContext(caseStudyById(SONG)!).id,
    );

    menu = await openSongMenu();
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Add to queue" }),
    );
    expect(store.getState().queue).toEqual([SONG]);
    expect(status()).toHaveTextContent("Added to queue");

    menu = await openSongMenu();
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Save to Your Library" }),
    );
    expect(store.getState().saved).toContain(SONG);
    expect(status()).toHaveTextContent("Saved to Your Library");

    menu = await openSongMenu();
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Remove from Your Library" }),
    );
    expect(store.getState().saved).not.toContain(SONG);
    expect(status()).toHaveTextContent("Removed from Your Library");
    expect(
      within(await openSongMenu()).getByRole("menuitem", {
        name: "Download CV",
      }),
    ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
  });

  it("goes to the song, its release and the artist", async () => {
    const { router } = setup();
    fireEvent.click(
      within(await openSongMenu()).getByRole("menuitem", {
        name: "Go to song",
      }),
    );
    expect(router.state.location.pathname).toBe(song.href);
    fireEvent.click(
      within(await openSongMenu()).getByRole("menuitem", { name: "Go to EP" }),
    );
    expect(router.state.location.pathname).toBe("/playlist/experience");
    fireEvent.click(
      within(await openSongMenu()).getByRole("menuitem", {
        name: "Go to artist",
      }),
    );
    expect(router.state.location.pathname).toBe("/artist");
  });

  it("copies the live link, and says so honestly when it can't", async () => {
    setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    fireEvent.click(
      within(await openSongMenu()).getByRole("menuitem", {
        name: "Copy song link",
      }),
    );
    await waitFor(() =>
      expect(status()).toHaveTextContent("Link copied to clipboard"),
    );
    expect(writeText).toHaveBeenCalledWith(absoluteUrl(song.href));

    writeText.mockRejectedValueOnce(new Error("denied"));
    fireEvent.click(
      within(await openSongMenu()).getByRole("menuitem", {
        name: "Copy song link",
      }),
    );
    await waitFor(() =>
      expect(status()).toHaveTextContent("Couldn't copy the link"),
    );

    setClipboard(undefined);
    fireEvent.click(
      within(await openSongMenu()).getByRole("menuitem", {
        name: "Copy song link",
      }),
    );
    await waitFor(() =>
      expect(status().querySelectorAll("p")[2]).toHaveTextContent(
        "Couldn't copy the link",
      ),
    );
  });

  it("shows the credits in a dialog", async () => {
    setup();
    fireEvent.click(
      within(await openSongMenu()).getByRole("menuitem", {
        name: "View credits",
      }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Credits" });
    expect(dialog).toHaveTextContent(song.title);
    expect(dialog).toHaveTextContent(caseStudyById(SONG)!.role);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close credits" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("opens the same actions on right-click", async () => {
    const { store } = setup();
    fireEvent.contextMenu(screen.getByText("Song row"));
    const menu = await screen.findByRole("menu");
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Add to queue" }),
    );
    expect(store.getState().queue).toEqual([SONG]);

    fireEvent.contextMenu(screen.getByText("Song row"));
    fireEvent.click(
      within(await screen.findByRole("menu")).getByRole("menuitem", {
        name: "View credits",
      }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Credits" }),
    ).toBeVisible();
  });
});

describe("opening menus from the keyboard", () => {
  const moreOptions = () =>
    screen.getByRole("button", { name: `More options for ${song.title}` });

  it("starts on the first item for ArrowDown, Enter and Space, and on the last for ArrowUp", async () => {
    setup();
    fireEvent.keyDown(moreOptions(), { key: "ArrowDown" });
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Play" })).toHaveFocus(),
    );
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await waitFor(() => expect(moreOptions()).toHaveFocus());

    fireEvent.keyDown(moreOptions(), { key: "ArrowUp" });
    await waitFor(() =>
      expect(
        screen.getByRole("menuitem", { name: "Download CV" }),
      ).toHaveFocus(),
    );
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await waitFor(() => expect(moreOptions()).toHaveFocus());

    // Enter and Space reach the button as a click with no pointer (detail 0).
    fireEvent.click(moreOptions(), { detail: 0 });
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Play" })).toHaveFocus(),
    );
  });

  it("highlights nothing when the pointer opens a menu", async () => {
    setup();
    fireEvent.click(moreOptions(), { detail: 1 });
    const menu = await screen.findByRole("menu");
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(within(menu).queryAllByRole("menuitem")).not.toContain(
      document.activeElement,
    );
  });

  it("opens a row's menu on its first item from the Menu key", async () => {
    setup();
    fireEvent.contextMenu(screen.getByText("Song row"), {
      clientX: 0,
      clientY: 0,
    });
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Play" })).toHaveFocus(),
    );
  });
});

describe("release menus", () => {
  it("plays or queues a whole release and links to it", async () => {
    const { store, router } = setup();
    const context = releaseContext(experience);
    fireEvent.click(
      screen.getByRole("button", { name: "More options for Experience" }),
    );
    let menu = await screen.findByRole("menu");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Play" }));
    expect(store.getState().context.id).toBe(context.id);
    expect(store.getState().status).toBe("playing");

    fireEvent.contextMenu(screen.getByText("Release row"));
    menu = await screen.findByRole("menu");
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Add to queue" }),
    );
    expect(store.getState().queue).toEqual(context.trackIds);
    expect(status()).toHaveTextContent(
      `Added ${context.trackIds.length} songs to queue`,
    );

    fireEvent.contextMenu(screen.getByText("Release row"));
    menu = await screen.findByRole("menu");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Go to EP" }));
    expect(router.state.location.pathname).toBe("/playlist/experience");

    fireEvent.contextMenu(screen.getByText("Release row"));
    menu = await screen.findByRole("menu");
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Go to artist" }),
    );
    expect(router.state.location.pathname).toBe("/artist");

    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    fireEvent.contextMenu(screen.getByText("Release row"));
    menu = await screen.findByRole("menu");
    act(() => {
      fireEvent.click(
        within(menu).getByRole("menuitem", { name: "Copy link to EP" }),
      );
    });
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(absoluteUrl(context.href)),
    );
    fireEvent.contextMenu(screen.getByText("Release row"));
    expect(
      within(await screen.findByRole("menu")).getByRole("menuitem", {
        name: "Download CV",
      }),
    ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
  });

  it("refuses an unknown release", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      render(
        <PlayerProvider createAudio={() => null}>
          <ReleaseMenu releaseId="missing" />
        </PlayerProvider>,
      ),
    ).toThrow("Unknown release: missing");
  });
});
