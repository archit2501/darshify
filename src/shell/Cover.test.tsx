import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { artistArt } from "../content/artwork";
import { Cover } from "./Cover";

describe("Cover", () => {
  it("renders decorative, lazily loaded artwork at a fixed thumbnail size", () => {
    const { container } = render(<Cover art={artistArt} size="sm" />);
    const frame = container.firstElementChild as HTMLElement;
    const image = container.querySelector("img")!;

    expect(frame).toHaveAttribute("data-cover", "darshil-jain");
    expect(frame.style.width).toBe("48px");
    expect(frame).toHaveClass("rounded-row");
    expect(image).toHaveAttribute("src", "/covers/artist.svg");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("width", "48");
  });

  it("fetches priority artwork eagerly and paints an editorial label for sighted users only", () => {
    const { container } = render(
      <Cover
        art={artistArt}
        label="Darshil Jain"
        eyebrow="This is"
        priority
        round
      />,
    );
    const image = container.querySelector("img")!;
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(container.firstElementChild).toHaveClass("rounded-full");
    const label = container.querySelector('[aria-hidden="true"]')!;
    expect(label).toHaveTextContent("This isDarshil Jain");
  });

  it("serves a real portrait as responsive AVIF and WebP with a JPEG fallback", () => {
    const portrait = {
      dominantColor: "#203040",
      variants: [256, 1200].map((width) => ({
        width,
        avif: `/p/${width}.avif`,
        webp: `/p/${width}.webp`,
        jpg: `/p/${width}.jpg`,
      })),
    };
    const { container } = render(
      <Cover art={artistArt} portrait={portrait} size="xl" />,
    );
    const sources = container.querySelectorAll("source");
    expect(sources[0]).toHaveAttribute("type", "image/avif");
    expect(sources[0]).toHaveAttribute(
      "srcset",
      "/p/256.avif 256w, /p/1200.avif 1200w",
    );
    expect(sources[1]).toHaveAttribute("type", "image/webp");
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/p/1200.jpg",
    );
    expect(
      (container.firstElementChild as HTMLElement).style.backgroundColor,
    ).toBe("rgb(32, 48, 64)");
  });
});
