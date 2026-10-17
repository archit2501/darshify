// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderArt } from "../artwork/render";
import { artistArt, genreArt, releaseArt, songArt } from "./artwork";
import { portfolio } from "./portfolio";

const allArt = [
  artistArt,
  ...portfolio.collections.map(releaseArt),
  ...portfolio.caseStudies.map(songArt),
  ...portfolio.genres.map(genreArt),
];

describe("cover artwork mapping", () => {
  it("gives every release, song, genre and the artist a unique cover", () => {
    expect(new Set(allArt.map((art) => art.src)).size).toBe(allArt.length);
  });

  // Regression: editing content without rerunning the generator leaves stale or missing covers.
  it("keeps every committed cover identical to the generator's output", () => {
    for (const art of allArt) {
      const file = join(process.cwd(), "public", art.src);
      expect(existsSync(file), `${art.src} is missing`).toBe(true);
      expect(readFileSync(file, "utf8"), `${art.src} is stale`).toBe(
        renderArt(art),
      );
    }
  });

  it("paints songs by what they are and keeps their content colour", () => {
    const figmenta = portfolio.caseStudies.find((item) => item.id === "r1")!;
    const igniters = portfolio.caseStudies.find((item) => item.id === "l1")!;
    expect(songArt(figmenta)).toMatchObject({
      style: "orbit",
      color: figmenta.color,
      src: "/covers/songs/r1.svg",
    });
    expect(songArt(igniters).style).toBe("rise");
    expect(songArt(figmenta).gradient).toMatch(/^linear-gradient\(135deg,#/);
  });

  it("falls back to the wave style for an unmapped release", () => {
    const release = { ...portfolio.collections[0], id: "future-mix" };
    expect(releaseArt(release).style).toBe("wave");
  });
});
