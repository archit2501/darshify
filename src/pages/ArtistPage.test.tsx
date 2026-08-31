import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CareerMixProvider } from "../career-mix/CareerMixContext";
import { ArtistPage } from "./ArtistPage";

const renderArtist = () =>
  render(
    <MemoryRouter>
      <CareerMixProvider>
        <ArtistPage />
      </CareerMixProvider>
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
  it("orders proposition, proof, releases, profile detail, and conversion", () => {
    renderArtist();

    const sections = [
      screen.getByRole("region", { name: "Candidate proposition" }),
      screen.getByRole("region", { name: "Selected Impact" }),
      screen.getByRole("region", { name: "Proof Waveform" }),
      screen.getByRole("region", { name: "Career Releases" }),
      screen.getByRole("region", { name: "About Darshil Jain" }),
      screen.getByRole("region", { name: "Education and skills" }),
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

  it("renders three sourced impact rows with visible actions", () => {
    renderArtist();

    const impact = screen.getByRole("region", { name: "Selected Impact" });
    expect(within(impact).getAllByRole("article")).toHaveLength(3);
    expect(
      within(impact).getAllByRole("link", { name: "Read case study" }),
    ).toHaveLength(3);
    expect(within(impact).getAllByText("Darshil Jain résumé")).toHaveLength(3);
    expect(within(impact).getAllByText(/^Outcome:/)).toHaveLength(3);
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
