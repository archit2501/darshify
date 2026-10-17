import { describe, expect, it } from "vitest";
import { ARTIST_COLOR } from "./artwork";
import { darken, playerSurface, relativeLuminance } from "./color";
import { portfolio } from "./portfolio";
import { rewindSlides } from "./rewind";

// Text over song, release and slide colours sits on gradients that axe can't
// measure, so the colour rules are checked here for every colour in use.
// WCAG 2.2 AA: 4.5:1 for text, 3:1 for large text (24px, or 18.66px bold).

/** Contrast of white at `alpha` over a solid #rrggbb background. */
const whiteOn = (background: string, alpha = 1) => {
  const blended = `#${[1, 3, 5]
    .map((index) => {
      const channel = parseInt(background.slice(index, index + 2), 16);
      return Math.round(255 * alpha + channel * (1 - alpha))
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
  return (
    (relativeLuminance(blended) + 0.05) / (relativeLuminance(background) + 0.05)
  );
};

const songColors = portfolio.caseStudies.map(({ color }) => color);
const headerColors = [
  ...songColors,
  ...portfolio.collections.map(({ color }) => color),
  ...portfolio.genres.map(({ color }) => color),
  ARTIST_COLOR,
  ...(portfolio.candidate.portrait
    ? [portfolio.candidate.portrait.dominantColor]
    : []),
];

describe("text contrast on colour", () => {
  it("keeps player text and lyrics readable on every song", () => {
    for (const color of songColors) {
      const surface = playerSurface(color);
      // Titles, icons and the active lyric line.
      expect(whiteOn(surface), color).toBeGreaterThanOrEqual(4.5);
      // Artist line, "Playing from", sung lyric lines (text-white/80).
      expect(whiteOn(surface, 0.8), color).toBeGreaterThanOrEqual(4.5);
      // Upcoming lyric lines: 20px+ bold, so large text (text-white/55).
      expect(whiteOn(surface, 0.55), color).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps release header text readable on every header colour", () => {
    for (const color of headerColors) {
      // Type, title and artist name, anywhere on the header.
      expect(whiteOn(color), color).toBeGreaterThanOrEqual(4.5);
      // Description and meta (text-white/85) sit in the lower half, under
      // at least 15% of the header's black gradient.
      expect(whiteOn(darken(color, 0.15), 0.85), color).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  // Rewind's decorative blobs are black, so they only darken the slide.
  it("keeps every Rewind slide readable", () => {
    for (const { color, id } of rewindSlides()) {
      // Kickers, notes and the numbers (full white).
      expect(whiteOn(color), id).toBeGreaterThanOrEqual(4.5);
      // Row details on bg-black/20 (text-white/85).
      expect(whiteOn(darken(color, 0.2), 0.85), id).toBeGreaterThanOrEqual(4.5);
    }
  });
});
