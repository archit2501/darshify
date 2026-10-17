import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { PlayerProvider } from "../player/PlayerProvider";
import { ArtistPage } from "./ArtistPage";

const renderArtist = () =>
  render(
    <MemoryRouter>
      <PlayerProvider createAudio={() => null}>
        <ArtistPage />
      </PlayerProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => vi.unstubAllGlobals());

describe("Artist recruiter profile", () => {
  it("orders proposition, popular songs, discography, about, answers and conversion", () => {
    renderArtist();

    const sections = [
      screen.getByRole("region", { name: "Candidate proposition" }),
      screen.getByRole("region", { name: "Popular" }),
      screen.getByRole("region", { name: "Discography" }),
      screen.getByRole("region", { name: "About Darshil Jain" }),
      screen.getByRole("region", { name: "Frequently asked questions" }),
      screen.getByRole("region", { name: "Availability" }),
      screen.getByRole("region", { name: "Start a conversation" }),
    ];

    for (let index = 1; index < sections.length; index += 1) {
      expect(
        sections[index - 1].compareDocumentPosition(sections[index]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("lists the popular songs with their sourced impact and real playback", () => {
    renderArtist();

    const popular = screen.getByRole("region", { name: "Popular" });
    const rows = within(popular).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(5);
    expect(
      within(rows[0]!).getByRole("link", {
        name: "Operations Intern at Figmenta",
      }),
    ).toHaveAttribute("href", "/case-studies/figmenta-operations-intern");
    expect(rows[0]).toHaveTextContent("500+ résumés screened");
    expect(
      within(rows[0]!).getByRole("button", {
        name: "Play Operations Intern at Figmenta",
      }),
    ).toBeInTheDocument();
  });

  it("answers the questions people ask, in page text", () => {
    renderArtist();

    const faq = screen.getByRole("region", {
      name: "Frequently asked questions",
    });
    expect(within(faq).getByText("Who is Darshil Jain?")).toBeVisible();
    expect(
      within(faq).getByText(/BBA \(Business & Industry\) student at Maharaja/),
    ).toBeVisible();
  });

  it("surfaces a complete canonical proof claim in the proposition", () => {
    renderArtist();

    const proposition = screen.getByRole("region", {
      name: "Candidate proposition",
    });
    const featuredProof = within(proposition).getByRole("article", {
      name: "Featured proof: résumés screened",
    });

    expect(within(featuredProof).getByText("500+")).toBeVisible();
    expect(
      within(featuredProof).getByText(
        "Résumés screened during hiring support at Figmenta.",
      ),
    ).toBeVisible();
    expect(
      within(featuredProof).getByRole("link", {
        name: "Darshil Jain résumé",
      }),
    ).toHaveAttribute("href", "/Darshil_Jain_Resume.pdf");
    expect(within(featuredProof).getByText("self-reported")).toBeVisible();
    expect(
      within(featuredProof).getByRole("link", {
        name: "View sourced case study",
      }),
    ).toHaveAttribute("href", "/case-studies/figmenta-operations-intern");
  });

  it("contains no fabricated authority, popularity, or social controls", () => {
    const view = renderArtist();
    const forbidden =
      /verified candidate|monthly listeners|\bfollow\b|\bplays\b/i;

    expect(view.container).not.toHaveTextContent(forbidden);
    for (const control of view.container.querySelectorAll("a, button, input")) {
      expect(control).not.toHaveAccessibleName(forbidden);
    }
  });
});
