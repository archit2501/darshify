import { describe, it, expect } from "vitest";
import { artist, tracks, playlists, genres, trackById } from "./library";

describe("library data", () => {
  it("has the artist and a non-empty catalogue", () => {
    expect(artist.name).toBe("Darshil Jain");
    expect(tracks.length).toBeGreaterThanOrEqual(15);
  });
  it("every playlist trackId resolves to a track", () => {
    for (const p of playlists) for (const id of p.trackIds) expect(trackById(id)).toBeTruthy();
  });
  it("exposes genre tiles for search", () => {
    expect(genres.length).toBeGreaterThanOrEqual(4);
  });
});
