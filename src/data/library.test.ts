import { describe, it, expect } from "vitest";
import { portfolio } from "../content/portfolio";
import {
  artist,
  tracks,
  playlists,
  genres,
  likedTrackIds,
  trackById,
} from "./library";

describe("library data", () => {
  it("has the artist and a non-empty catalogue", () => {
    expect(artist.name).toBe("Darshil Jain");
    expect(tracks.length).toBeGreaterThanOrEqual(15);
  });
  it("every playlist trackId resolves to a track", () => {
    for (const p of playlists)
      for (const id of p.trackIds) expect(trackById(id)).toBeTruthy();
  });
  it("exposes genre tiles for search", () => {
    expect(genres.length).toBeGreaterThanOrEqual(4);
  });

  it("derives presentation copy and collection membership from the portfolio", () => {
    expect(artist.name).toBe(portfolio.candidate.name);
    expect(trackById("r1")?.title).toBe(
      portfolio.caseStudies.find((item) => item.id === "r1")?.title,
    );

    for (const playlist of playlists) {
      const collection = portfolio.collections.find(
        (item) => item.id === playlist.id,
      );
      expect(collection).toBeDefined();
      expect(playlist.title).toBe(collection?.title);
      expect(playlist.trackIds).toEqual(collection?.caseStudyIds);
    }
  });

  it("does not let playlist adapter mutation alter canonical collections", () => {
    const playlist = playlists[0];
    const collection = portfolio.collections.find(
      (item) => item.id === playlist.id,
    );
    if (!collection) throw new Error("Fixture collection is missing");
    const canonicalIds = [...collection.caseStudyIds];

    try {
      playlist.trackIds.push("adapter-only");
      expect(collection.caseStudyIds).toEqual(canonicalIds);
    } finally {
      playlist.trackIds.pop();
    }
  });

  it("does not let liked-track adapter mutation alter achievements", () => {
    const collection = portfolio.collections.find(
      (item) => item.id === "achievements",
    );
    if (!collection) throw new Error("Fixture collection is missing");
    const canonicalIds = [...collection.caseStudyIds];

    try {
      likedTrackIds.push("adapter-only");
      expect(collection.caseStudyIds).toEqual(canonicalIds);
    } finally {
      likedTrackIds.pop();
    }
  });
});
