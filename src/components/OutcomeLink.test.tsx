import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const { trackOutcome } = vi.hoisted(() => ({ trackOutcome: vi.fn() }));
vi.mock("../analytics/outcomes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../analytics/outcomes")>()),
  trackOutcome,
}));

import { OutcomeLink } from "./OutcomeLink";

afterEach(() => window.history.pushState({}, "", "/"));

describe("OutcomeLink", () => {
  it("tracks an approved outcome without replacing native anchor behavior", () => {
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    );
    render(
      <OutcomeLink
        href="/Darshil_Jain_Resume.pdf"
        download
        outcome="cv_download"
        properties={{ placement: "hero" }}
        onClick={onClick}
      >
        Download CV
      </OutcomeLink>,
    );

    const link = screen.getByRole("link", { name: "Download CV" });
    expect(link).toHaveAttribute("href", "/Darshil_Jain_Resume.pdf");
    expect(link).toHaveAttribute("download");
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
    expect(trackOutcome).toHaveBeenCalledWith("cv_download", {
      routeId: "home",
      placement: "hero",
    });
  });

  it("keeps internal case-study navigation as an ordinary crawlable link", () => {
    window.history.pushState({}, "", "/search");
    render(
      <MemoryRouter initialEntries={["/search"]}>
        <OutcomeLink
          to="/case-studies/figmenta-operations-intern"
          outcome="case_study_open"
          properties={{ caseStudyId: "r1", placement: "proof-track" }}
        >
          Read case study
        </OutcomeLink>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Read case study" });
    expect(link).toHaveAttribute(
      "href",
      "/case-studies/figmenta-operations-intern",
    );
    fireEvent.click(link);
    expect(trackOutcome).toHaveBeenLastCalledWith("case_study_open", {
      routeId: "search",
      caseStudyId: "r1",
      placement: "proof-track",
    });
  });
});
