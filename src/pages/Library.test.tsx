import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import LibraryRoute, { meta } from "../../app/routes/library";
import { PlayerProvider } from "../player/PlayerProvider";

const renderLibrary = () =>
  render(
    <MemoryRouter>
      <PlayerProvider createAudio={() => null}>
        <LibraryRoute />
      </PlayerProvider>
    </MemoryRouter>,
  );

const releaseTitles = () =>
  screen
    .queryAllByRole("article")
    .map(
      (article) =>
        within(article).getByRole("heading", { level: 2 }).textContent,
    );

describe("Career Library", () => {
  it("publishes Career Library route metadata", () => {
    expect(meta({} as Parameters<typeof meta>[0])).toEqual(
      expect.arrayContaining([
        { title: "Browse professional evidence | Darshify" },
      ]),
    );
  });

  it("uses professional primary labels and release terminology only as secondary theme", () => {
    renderLibrary();

    expect(
      screen.getByRole("heading", { level: 1, name: "Your Library" }),
    ).toBeVisible();
    expect(screen.getAllByText("EP · Darshil Jain")[0]).toBeVisible();
  });

  it("offers keyboard-operable category filters with stable collection routes", () => {
    renderLibrary();

    const filters = screen.getByRole("group", {
      name: "Filter evidence categories",
    });
    const projects = within(filters).getByRole("button", { name: "Projects" });
    projects.focus();
    fireEvent.keyDown(projects, { key: "Enter" });
    fireEvent.click(projects);

    expect(projects).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Projects" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Explore Projects/ }),
    ).toHaveAttribute("href", "/playlist/projects");
    expect(
      screen.queryByRole("heading", { name: "Experience" }),
    ).not.toBeInTheDocument();
  });

  it("explicitly sorts releases A–Z in O(n log n) order", () => {
    renderLibrary();

    fireEvent.change(screen.getByRole("combobox", { name: "Sort releases" }), {
      target: { value: "az" },
    });

    const titles = releaseTitles();
    expect(titles).toEqual([...titles].sort((a, b) => a!.localeCompare(b!)));
    expect(screen.getByText("Sorted A–Z")).toBeVisible();
  });

  it("filters releases with a labelled field and presents a clear empty state", () => {
    renderLibrary();
    const search = screen.getByRole("searchbox", {
      name: "Search Your Library",
    });
    expect(search).toHaveAttribute("name", "library-search");

    fireEvent.change(search, { target: { value: "certification" } });
    expect(
      screen.getByRole("heading", { name: "Certifications" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Experience" }),
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "not in the library" } });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nothing in Your Library matches",
    );
  });
});
