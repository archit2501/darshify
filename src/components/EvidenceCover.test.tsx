import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { portfolio } from "../content/portfolio";
import type { Artifact } from "../content/types";
import { EvidenceCover } from "./EvidenceCover";

describe("EvidenceCover", () => {
  // Regression: rendering a full-size work-sample image without intrinsic dimensions or its authored variants causes layout shift and oversized downloads.
  it("renders a real artifact image with meaningful alt text, dimensions, aspect, and actual responsive variants", () => {
    const imageArtifact = {
      id: "real-dashboard-crop",
      title: "Operations dashboard crop",
      kind: "dashboard",
      alt: "Redacted operations dashboard showing project status columns.",
      provenance: "Candidate-provided redacted work sample.",
      sourceIds: ["darshil-resume"],
      status: "redacted",
      image: {
        src: "/artifacts/dashboard-1280.webp",
        width: 1280,
        height: 720,
        variants: [
          { src: "/artifacts/dashboard-640.webp", width: 640 },
          { src: "/artifacts/dashboard-1280.webp", width: 1280 },
        ],
      },
    } satisfies Artifact;

    render(<EvidenceCover artifact={imageArtifact} aspect="16:9" priority />);

    const image = screen.getByRole("img", {
      name: imageArtifact.alt,
    });
    expect(image).toHaveAttribute("width", "1280");
    expect(image).toHaveAttribute("height", "720");
    expect(image).toHaveAttribute(
      "srcset",
      "/artifacts/dashboard-640.webp 640w, /artifacts/dashboard-1280.webp 1280w",
    );
    expect(image).toHaveAttribute("sizes", "(min-width: 768px) 50vw, 100vw");
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image.parentElement).toHaveStyle({ aspectRatio: "16 / 9" });
  });

  // Regression: a missing real artifact used to fall back to generic AI cover art with no candidate-specific evidence.
  it("renders a fact-led SVG fallback from the artifact's linked canonical evidence", () => {
    render(<EvidenceCover artifact={portfolio.artifacts[0]} aspect="1:1" />);

    const graphic = screen.getByRole("img", {
      name: portfolio.artifacts[0].alt,
    });
    expect(graphic.tagName.toLowerCase()).toBe("svg");
    expect(screen.getByText("Figmenta")).toBeVisible();
    expect(screen.getByText("35+ projects")).toBeVisible();
    expect(screen.getByText("Experience")).toBeVisible();
    expect(graphic.parentElement).toHaveStyle({ aspectRatio: "1 / 1" });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  // Regression: row crops that inherit the square cover ratio consume most of compact evidence rows.
  it("uses the authored compact ratio for row covers", () => {
    render(<EvidenceCover artifact={portfolio.artifacts[0]} aspect="row" />);

    expect(
      screen.getByRole("img", { name: portfolio.artifacts[0].alt })
        .parentElement,
    ).toHaveStyle({ aspectRatio: "5 / 1" });
  });

  // Regression: zero intrinsic dimensions technically satisfy the type shape but still cause layout shift and invalid image geometry.
  it("rejects image artifacts without positive intrinsic dimensions", () => {
    const invalidArtifact = {
      ...portfolio.artifacts[0],
      image: {
        src: "/artifacts/invalid.webp",
        width: 0,
        height: 720,
      },
    } satisfies Artifact;

    expect(() =>
      render(<EvidenceCover artifact={invalidArtifact} aspect="16:9" />),
    ).toThrow(
      "Artifact darshil-resume-pdf must declare positive image dimensions",
    );
  });

  // Regression: inventing typography for an unknown artifact gives unsupported copy the visual authority of canonical evidence.
  it("rejects a fact-led fallback without canonical linked evidence", () => {
    const unsupportedArtifact = {
      ...portfolio.artifacts[0],
      id: "unknown-artifact",
      title: "Unknown artifact",
    } satisfies Artifact;

    expect(() =>
      render(<EvidenceCover artifact={unsupportedArtifact} aspect="1:1" />),
    ).toThrow("Artifact unknown-artifact has no canonical fallback evidence");
  });
});
