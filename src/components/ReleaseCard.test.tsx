import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { collectionById } from "../content/selectors";
import { ReleaseCard } from "./ReleaseCard";

describe("ReleaseCard", () => {
  it("pairs a professional category with a secondary release label", () => {
    const collection = collectionById("experience");
    expect(collection).toBeDefined();

    render(
      <MemoryRouter>
        <ReleaseCard collection={collection!} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Professional category")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Experience" })).toBeVisible();
    expect(screen.getByText("Career EP")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Explore Experience/i }),
    ).toHaveAttribute("href", "/playlist/experience");
  });

  it("uses the stable achievements alias", () => {
    const collection = collectionById("achievements");
    expect(collection).toBeDefined();

    render(
      <MemoryRouter>
        <ReleaseCard collection={collection!} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /Explore Achievements/i }),
    ).toHaveAttribute("href", "/liked");
    expect(screen.getByText("Recognition EP")).toBeVisible();
  });
});
