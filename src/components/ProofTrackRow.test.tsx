import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { caseStudyEvidenceById } from "../content/selectors";
import { ProofTrackRow } from "./ProofTrackRow";

describe("ProofTrackRow", () => {
  it("keeps the outcome, source, proof value, and case-study action visible", () => {
    const evidence = caseStudyEvidenceById("r1");
    expect(evidence).toBeDefined();

    render(
      <MemoryRouter>
        <ol>
          <ProofTrackRow evidence={evidence!} index={0} />
        </ol>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Operations Internship at Figmenta",
      }),
    ).toBeVisible();
    expect(screen.getByText("Figmenta · Jan 2026 – Feb 2026")).toBeVisible();
    expect(screen.getByText("35+ projects")).toBeVisible();
    expect(screen.getByText("Darshil Jain résumé")).toBeVisible();
    expect(screen.getByText("self-reported")).toBeVisible();
    expect(screen.getByText(/^Outcome:/).parentElement).toHaveTextContent(
      "improved workflow visibility",
    );

    const action = screen.getByRole("link", { name: "Read case study" });
    expect(action).toBeVisible();
    expect(action).toHaveAttribute(
      "href",
      "/case-studies/figmenta-operations-intern",
    );
    action.focus();
    expect(action).toHaveFocus();
  });

  it("labels résumé-only cases without fabricating a quantitative value", () => {
    const evidence = caseStudyEvidenceById("p1");
    expect(evidence).toBeDefined();

    render(
      <MemoryRouter>
        <ol>
          <ProofTrackRow evidence={evidence!} index={0} />
        </ol>
      </MemoryRouter>,
    );

    expect(screen.getByText("Résumé-listed evidence")).toBeVisible();
    expect(screen.queryByText("Projects tracked")).not.toBeInTheDocument();
    expect(screen.getByText("Darshil Jain résumé")).toBeVisible();
  });
});
