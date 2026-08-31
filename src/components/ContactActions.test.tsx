import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import { ContactActions } from "./ContactActions";

describe("ContactActions", () => {
  // Regression: hard-coded shell details can drift from the candidate source of truth and send recruiters to stale destinations.
  it("renders native CV, email, and LinkedIn links from the candidate profile", () => {
    render(<ContactActions candidate={portfolio.candidate} placement="hero" />);

    expect(screen.getByRole("link", { name: /download cv/i })).toHaveAttribute(
      "href",
      "/Darshil_Jain_Resume.pdf",
    );
    expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute(
      "href",
      `mailto:${portfolio.candidate.email}`,
    );
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
      "href",
      portfolio.candidate.linkedInUrl,
    );
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
      "rel",
      expect.stringContaining("noreferrer"),
    );
  });

  // Regression: later analytics wiring can lose which native conversion link and shell placement the recruiter used.
  it("reports each conversion and placement without replacing link behavior", () => {
    const onAction = vi.fn();
    render(
      <ContactActions
        candidate={portfolio.candidate}
        placement="topbar"
        onAction={onAction}
      />,
    );

    const links = [
      screen.getByRole("link", { name: /download cv/i }),
      screen.getByRole("link", { name: /email/i }),
      screen.getByRole("link", { name: /linkedin/i }),
    ];
    links.forEach((link) =>
      link.addEventListener("click", (event) => event.preventDefault()),
    );
    links.forEach((link) => fireEvent.click(link));

    expect(onAction.mock.calls).toEqual([
      ["cv", "topbar"],
      ["email", "topbar"],
      ["linkedin", "topbar"],
    ]);
  });
});
