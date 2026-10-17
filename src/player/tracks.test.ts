import { describe, expect, it } from "vitest";
import { portfolio } from "../content/portfolio";
import {
  ARTIST_TOP_TRACK_IDS,
  INTRO_MS,
  OUTRO_MS,
  activeCueIndex,
  artistContext,
  defaultContext,
  genreContext,
  lineDurationMs,
  releaseContext,
  songContext,
  trackById,
  trackFromSong,
} from "./tracks";

const song = (id: string) =>
  portfolio.caseStudies.find((item) => item.id === id)!;

describe("tracks", () => {
  it("times every lyric line at a readable pace inside the song", () => {
    const track = trackFromSong(song("r1"));
    expect(track.cues).toHaveLength(song("r1").lyrics.length);
    expect(track.cues[0]!.startMs).toBe(INTRO_MS);
    for (let index = 1; index < track.cues.length; index += 1) {
      const gap = track.cues[index]!.startMs - track.cues[index - 1]!.startMs;
      expect(gap).toBe(lineDurationMs(track.cues[index - 1]!.text));
      expect(gap).toBeGreaterThanOrEqual(3000);
      expect(gap).toBeLessThanOrEqual(7000);
    }
    const last = track.cues.at(-1)!;
    expect(track.durationMs).toBe(
      last.startMs + lineDurationMs(last.text) + OUTRO_MS,
    );
    expect(track).toMatchObject({
      title: "Operations Intern at Figmenta",
      subtitle: "Figmenta",
      href: "/case-studies/figmenta-operations-intern",
      kind: "experience",
    });
  });

  it("keeps every song between a short single and a long-form track", () => {
    for (const item of portfolio.caseStudies) {
      const track = trackById(item.id)!;
      expect(track.durationMs).toBeGreaterThan(6000);
      expect(track.durationMs).toBeLessThan(45000);
    }
    expect(trackById("missing")).toBeUndefined();
  });

  it("finds the line being sung with a binary search", () => {
    const cues = [
      { text: "a", startMs: 1000 },
      { text: "b", startMs: 4000 },
      { text: "c", startMs: 8000 },
    ];
    expect(activeCueIndex(cues, 0)).toBe(-1);
    expect(activeCueIndex(cues, 1000)).toBe(0);
    expect(activeCueIndex(cues, 3999)).toBe(0);
    expect(activeCueIndex(cues, 4000)).toBe(1);
    expect(activeCueIndex(cues, 99999)).toBe(2);
    expect(activeCueIndex([], 5000)).toBe(-1);
  });

  it("builds play contexts for releases, genres, the artist and songs", () => {
    const experience = portfolio.collections.find(
      (item) => item.id === "experience",
    )!;
    expect(releaseContext(experience)).toEqual({
      id: "release:experience",
      kind: "release",
      title: "Experience",
      href: "/playlist/experience",
      trackIds: ["r1", "r2", "r3"],
    });
    const awards = portfolio.collections.find(
      (item) => item.id === "achievements",
    )!;
    expect(releaseContext(awards).href).toBe("/liked");

    const excel = portfolio.genres.find(
      (genre) => genre.slug === "microsoft-excel",
    )!;
    expect(genreContext(excel)).toMatchObject({
      id: "genre:microsoft-excel",
      href: "/genre/microsoft-excel",
      trackIds: ["r1", "c3"],
    });

    expect(artistContext.trackIds).toEqual([...ARTIST_TOP_TRACK_IDS]);
    expect(defaultContext.id).toBe("release:this-is-darshil-jain");
    expect(songContext(song("p2")).id).toBe("release:projects");
    expect(songContext(song("a4")).id).toBe("release:achievements");
    const orphan = { ...song("r1"), id: "orphan" };
    expect(songContext(orphan).id).toBe("release:this-is-darshil-jain");
  });
});
