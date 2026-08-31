import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SearchRoute, { meta } from "../../app/routes/search";

const renderSearch = () =>
  render(
    <MemoryRouter>
      <SearchRoute />
    </MemoryRouter>,
  );

describe("Search professional discovery", () => {
  it("publishes professional discovery route metadata", () => {
    expect(meta({} as Parameters<typeof meta>[0])).toEqual(
      expect.arrayContaining([
        { title: "Search professional evidence | Darshify" },
      ]),
    );
  });

  it("provides a visibly labelled, named search field without autofocus", () => {
    renderSearch();

    const field = screen.getByRole("searchbox", {
      name: "Search experience, skills, and evidence",
    });
    expect(field).toHaveAttribute("name", "portfolio-search");
    expect(field).not.toHaveAttribute("autofocus");
    expect(
      screen.getByText("Search experience, skills, and evidence"),
    ).toBeVisible();
  });

  it.each([
    ["organization", "Figmenta", "Operations Internship at Figmenta"],
    ["skill", "Microsoft Excel", "Operations Internship at Figmenta"],
    ["situation", "team transition", "Operations Internship at PSR Compliance"],
    [
      "action",
      "behavioral nudges",
      "Telemedicine Consulting and Analytics Capstone",
    ],
    [
      "result",
      "publication-ready",
      "Haldiram's International Expansion Strategy",
    ],
    ["takeaway", "operating visibility", "Operations Internship at Figmenta"],
    [
      "source",
      "Candidate-authored source",
      "Operations Internship at Figmenta",
    ],
  ])("matches %s evidence deterministically", (_field, query, title) => {
    renderSearch();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: query },
    });

    expect(screen.getByRole("heading", { name: title })).toBeVisible();
    expect(
      screen
        .getByRole("heading", { name: title })
        .closest("article")
        ?.querySelector(`a[href^="/case-studies/"]`),
    ).not.toBeNull();
  });

  it("groups results with professional headings and stable routes", () => {
    renderSearch();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Strategic Analysis" },
    });

    expect(screen.getByRole("heading", { name: "Projects" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Achievements" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Skills" })).toBeVisible();

    const projects = screen.getByRole("region", { name: "Projects" });
    expect(
      within(projects).getByRole("link", {
        name: "Read ZautoAI Strategy Consulting Engagement",
      }),
    ).toHaveAttribute("href", "/case-studies/zautoai-strategy-consulting");

    const skills = screen.getByRole("region", { name: "Skills" });
    expect(
      within(skills).getByRole("link", { name: "Explore Strategic Analysis" }),
    ).toHaveAttribute("href", "/playlist/skills");
  });

  it("keeps education and certifications out of Achievements", () => {
    renderSearch();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "candidate-authored source" },
    });

    const achievements = screen.getByRole("region", { name: "Achievements" });
    const education = screen.getByRole("region", { name: "Education" });
    const certifications = screen.getByRole("region", {
      name: "Certifications",
    });

    expect(
      within(achievements).getByRole("heading", {
        name: "BPlan Showdown Winner",
      }),
    ).toBeVisible();
    expect(
      within(achievements).queryByRole("heading", {
        name: "BBA in Business and Industry",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(education).getByRole("heading", {
        name: "BBA in Business and Industry",
      }),
    ).toBeVisible();
    expect(
      within(certifications).getByRole("heading", {
        name: "Winter Consulting Program",
      }),
    ).toBeVisible();
  });

  it("announces only a concise count while leaving the result tree outside the live region", () => {
    renderSearch();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Figmenta" },
    });

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("1 match for “Figmenta”");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(
      screen.getByRole("region", { name: "Experience" }).closest("[aria-live]"),
    ).toBeNull();
  });

  it("announces a useful empty state and never persists raw queries", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderSearch();
    const field = screen.getByRole("searchbox");

    fireEvent.change(field, { target: { value: "no matching evidence" } });
    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.blur(field);

    expect(screen.getByRole("status")).toHaveTextContent(
      "No results for “no matching evidence”",
    );
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Try an organization",
    );
    expect(
      screen.getByText(/Try an organization, skill, action, result/),
    ).toBeVisible();
    expect(setItem).not.toHaveBeenCalled();
  });
});
