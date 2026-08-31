import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { portfolio } from "../content/portfolio";
import {
  artist,
  tracks,
  playlists,
  genres,
  likedTrackIds,
  trackById,
  ARTIST_HERO,
  AVATAR,
  LIKED_COVER,
  coverFor,
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
      if (playlist.id === "skills") continue;
      const collection = portfolio.collections.find(
        (item) => item.id === playlist.id,
      );
      expect(collection).toBeDefined();
      expect(playlist.title).toBe(collection?.title);
      expect(playlist.trackIds).toEqual(collection?.caseStudyIds);
    }
  });

  it("preserves the legacy first skill track for current UI consumers", () => {
    expect(tracks[0]).toEqual({
      id: "s1",
      title: "Market Research",
      subtitle: "Top Skills",
      kind: "skill",
      durationSec: 232,
      plays: 920000,
      detail: "Primary & secondary research, sizing, synthesis.",
      gradient: "linear-gradient(135deg,#ff4d6d,#7b2ff7)",
    });
  });

  it("preserves the legacy skills playlist membership and order", () => {
    expect(
      playlists.find((playlist) => playlist.id === "skills")?.trackIds,
    ).toEqual(["s1", "s2", "s3", "s4", "s5", "s6"]);
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

  // Regression: deleting the generic PNG directory before all legacy consumers move leaves broken artwork URLs throughout the shell.
  it("resolves every current cover consumer to a shipped evidence artifact", () => {
    const coverUrls = [
      ARTIST_HERO,
      AVATAR,
      LIKED_COVER,
      ...playlists.map((playlist) => playlist.cover),
      ...portfolio.collections.map((collection) => collection.cover),
      ...(["skill", "role", "project", "achievement", "cert"] as const).map(
        coverFor,
      ),
    ];

    for (const url of new Set(coverUrls)) {
      expect(url).toMatch(/^\/artifacts\/[a-z0-9-]+\.svg$/);
      expect(existsSync(resolve(process.cwd(), "public", url.slice(1)))).toBe(
        true,
      );
    }

    expect(
      new Set(portfolio.collections.map((collection) => collection.cover)),
    ).toHaveLength(portfolio.collections.length);
    expect(
      portfolio.collections.find((collection) => collection.id === "certs")
        ?.cover,
    ).toBe("/artifacts/certifications.svg");
    expect(
      portfolio.collections.find((collection) => collection.id === "education")
        ?.cover,
    ).toBe("/artifacts/education.svg");
  });
});
