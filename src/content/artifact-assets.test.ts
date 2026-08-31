import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSvg = (filename: string) => {
  const source = readFileSync(
    resolve(process.cwd(), "public", "artifacts", filename),
    "utf8",
  );
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  expect(document.querySelector("parsererror")).not.toBeInTheDocument();
  return document;
};

const visibleText = (filename: string) =>
  [...readSvg(filename).querySelectorAll("text")]
    .map((node) => node.textContent?.trim())
    .filter(Boolean)
    .join(" | ");

describe("authored evidence SVGs", () => {
  // Regression: static quantitative cover claims can drift from typed evidence by dropping their period, source, or verification status.
  it.each([
    {
      file: "achievements.svg",
      proofLabel: "National placement",
      claim: "4 position",
      period: "Date not listed in résumé",
    },
    {
      file: "certifications.svg",
      proofLabel: "Program recognition",
      claim: "TOP 10%",
      period: "Dec 2025 – Jan 2026",
    },
    {
      file: "education.svg",
      proofLabel: "Cumulative grade-point average",
      claim: "9.39 CGPA",
      period: "2024–2027",
    },
    {
      file: "experience.svg",
      proofLabel: "Résumés screened",
      claim: "500+ résumés",
      period: "Jan 2026 – Feb 2026",
    },
    {
      file: "profile-square.svg",
      proofLabel: "Résumés screened",
      claim: "500+ résumés",
      period: "Jan 2026 – Feb 2026",
    },
    {
      file: "profile-wide.svg",
      proofLabel: "Résumés screened",
      claim: "500+ résumés screened",
      period: "Jan 2026 – Feb 2026",
    },
    {
      file: "projects.svg",
      proofLabel: "Program recognition",
      claim: "TOP 10%",
      period: "Dec 2025 – Jan 2026",
    },
    {
      file: "skills.svg",
      proofLabel: "Projects tracked",
      claim: "35+ projects",
      period: "Jan 2026 – Feb 2026",
    },
  ])(
    "$file shows its quantitative claim with exact canonical provenance",
    ({ file, proofLabel, claim, period }) => {
      const text = visibleText(file);

      expect(text).toContain(proofLabel);
      expect(text).toContain(claim);
      expect(text).toContain(period);
      expect(text).toContain("Darshil Jain résumé");
      expect(text).toContain("self-reported");
    },
  );

  // Regression: arbitrary peaks on a static profile cover visually imply quantified proof without exposing a typed visible series or normalization semantics.
  it("keeps the wide profile composition non-quantitative beyond its labelled claim", () => {
    const document = readSvg("profile-wide.svg");

    expect(document.querySelectorAll("path")).toHaveLength(0);
  });
});
