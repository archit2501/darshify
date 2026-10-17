import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import { proofById } from "../content/selectors";
import { rewindSlides, topSkills } from "../content/rewind";
import { PlayerProvider } from "../player/PlayerProvider";
import { ToastProvider } from "../shell/Toast";
import { RewindPage, SLIDE_MS } from "./RewindPage";

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

let reduced = false;

beforeEach(() => {
  reduced = false;
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" && reduced,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderRewind() {
  const router = createMemoryRouter(
    [
      { path: "/rewind", element: <RewindPage /> },
      { path: "/", element: <h1>Home</h1> },
    ],
    { initialEntries: ["/rewind"] },
  );
  render(
    <PlayerProvider createAudio={() => null}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </PlayerProvider>,
  );
  return router;
}

const slides = rewindSlides();
const visibleSlide = () =>
  screen
    .getAllByRole("group", { hidden: true })
    .find((element) => !element.hidden)!;

describe("Rewind facts", () => {
  it("uses only résumé numbers and real counts", () => {
    const stats = slides.flatMap((slide) =>
      slide.kind === "stat" ? slide.stats : [],
    );
    const known = new Set(
      portfolio.proofPoints.map((proof) => `${proof.display} ${proof.label}`),
    );
    for (const stat of stats) {
      expect(known).toContain(`${stat.value} ${stat.label}`);
    }
    expect(proofById("figmenta-resumes")).toBeDefined();
    const [top] = topSkills(1);
    expect(top!.count).toBe(
      portfolio.caseStudies.filter((song) => song.skills.includes(top!.skill))
        .length,
    );
  });
});

describe("RewindPage", () => {
  it("tells the story one slide at a time and advances on its own", () => {
    vi.useFakeTimers();
    renderRewind();
    expect(
      screen.getByRole("heading", { level: 1, name: "Darshil's Rewind" }),
    ).toBeInTheDocument();
    expect(visibleSlide()).toHaveAccessibleName(`1 of ${slides.length}`);
    act(() => vi.advanceTimersByTime(SLIDE_MS));
    expect(visibleSlide()).toHaveAccessibleName(`2 of ${slides.length}`);

    fireEvent.click(screen.getByRole("button", { name: "Pause Rewind" }));
    act(() => vi.advanceTimersByTime(SLIDE_MS * 2));
    expect(visibleSlide()).toHaveAccessibleName(`2 of ${slides.length}`);
    fireEvent.click(screen.getByRole("button", { name: "Resume Rewind" }));
    act(() => vi.advanceTimersByTime(SLIDE_MS));
    expect(visibleSlide()).toHaveAccessibleName(`3 of ${slides.length}`);
  });

  it("steps with buttons, side taps and arrow keys, and leaves on Escape", () => {
    reduced = true;
    const router = renderRewind();
    const story = screen.getByRole("region", { name: "Darshil's Rewind" });
    expect(
      screen.queryByRole("button", { name: "Pause Rewind" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(visibleSlide()).toHaveAccessibleName(`2 of ${slides.length}`);
    fireEvent.keyDown(story, { key: "ArrowRight" });
    expect(visibleSlide()).toHaveAccessibleName(`3 of ${slides.length}`);
    fireEvent.keyDown(story, { key: "ArrowLeft" });
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(visibleSlide()).toHaveAccessibleName(`1 of ${slides.length}`);

    const card = visibleSlide().parentElement!.parentElement as HTMLElement;
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 400,
    } as DOMRect);
    fireEvent.click(visibleSlide(), { clientX: 350 });
    expect(visibleSlide()).toHaveAccessibleName(`2 of ${slides.length}`);
    fireEvent.click(visibleSlide(), { clientX: 20 });
    expect(visibleSlide()).toHaveAccessibleName(`1 of ${slides.length}`);

    fireEvent.keyDown(story, { key: "Escape" });
    expect(router.state.location.pathname).toBe("/");
  });

  it("ends on a summary with the CV, the playlist and a share link", async () => {
    reduced = true;
    renderRewind();
    for (let step = 1; step < slides.length; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    }
    const summary = visibleSlide();
    expect(summary).toHaveAccessibleName(
      `${slides.length} of ${slides.length}`,
    );
    expect(
      within(summary).getByRole("link", { name: "Download CV" }),
    ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
    expect(
      within(summary).getByRole("button", {
        name: "Play This Is Darshil Jain",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
    fireEvent.click(within(summary).getByRole("button", { name: "Share" }));
    expect(
      await screen.findByText(/Link copied|Couldn't copy the link/),
    ).toBeInTheDocument();
  });
});
