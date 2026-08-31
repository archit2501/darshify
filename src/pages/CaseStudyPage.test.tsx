import { createElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryRouter,
  RouterProvider,
  type LoaderFunctionArgs,
} from "react-router";
import { portfolio } from "../content/portfolio";
import { artifactById, proofById, sourceById } from "../content/selectors";
import { formatProofValue } from "../content/waveform";
import CaseStudyRoute, { loader, meta } from "../../app/routes/case-study";
import { buildRouteMeta } from "../seo/meta";
import { buildCreativeWorkJsonLd } from "../seo/structuredData";

const { trackOutcome } = vi.hoisted(() => ({ trackOutcome: vi.fn() }));
vi.mock("../analytics/outcomes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../analytics/outcomes")>()),
  trackOutcome,
}));

const expectedFeaturedProofByCaseId: Record<string, string | undefined> = {
  r1: "figmenta-resumes",
  r2: "psr-clients",
  r3: "mj-profiles",
  p1: undefined,
  p2: "iitg-participant-percentile",
  p3: undefined,
  p4: "zomato-metrics",
  l1: "converge-participants",
  a1: undefined,
  a2: "product-decode-rank",
  a3: undefined,
  a4: "iitg-participant-percentile",
  e1: "bba-cgpa",
  e2: "class-xii-percentage",
  c1: undefined,
  c2: "iitg-participant-percentile",
  c3: undefined,
};

const expectedRelatedCaseIds: Record<string, string[]> = {
  r1: ["r2", "r3"],
  r2: ["r1", "r3"],
  r3: ["r1", "r2"],
  p1: ["p2", "p3"],
  p2: ["a4", "c2"],
  p3: ["p1", "p4"],
  p4: ["p2", "p3"],
  l1: ["r1", "p1"],
  a1: ["a2", "a3"],
  a2: ["a1", "a3"],
  a3: ["a1", "a2"],
  a4: ["p2", "c2"],
  e1: ["e2", "c3"],
  e2: ["e1"],
  c1: ["c2", "c3"],
  c2: ["p2", "a4"],
  c3: ["c1", "e1"],
};

const loaderArgs = (slug: string) =>
  ({
    params: { slug },
    request: new Request(`https://darshify.test/case-studies/${slug}`),
  }) as unknown as LoaderFunctionArgs;

function renderCaseStudy(slug: string) {
  const path = `/case-studies/${slug}`;
  const router = createMemoryRouter(
    [
      {
        path: "/case-studies/:slug",
        loader,
        element: createElement(CaseStudyRoute),
      },
    ],
    { initialEntries: [path] },
  );

  return render(createElement(RouterProvider, { router }));
}

describe("case-study pages", () => {
  beforeEach(() => trackOutcome.mockClear());

  it("reports a case open and a source-evidence open using typed IDs only", async () => {
    const caseStudy = portfolio.caseStudies.find(({ id }) => id === "r1")!;
    renderCaseStudy(caseStudy.slug);

    await screen.findByRole("heading", { level: 1, name: caseStudy.title });
    expect(trackOutcome).toHaveBeenCalledWith("case_study_open", {
      caseStudyId: "r1",
      placement: "case-study",
    });

    const sourceLinks = screen.getAllByRole("link", {
      name: "Darshil Jain résumé",
    });
    sourceLinks.forEach((link) =>
      link.addEventListener("click", (event) => event.preventDefault()),
    );
    fireEvent.click(sourceLinks[0]);
    expect(trackOutcome).toHaveBeenCalledWith("evidence_open", {
      routeId: "home",
      evidenceId: "figmenta-projects",
      placement: "evidence-panel",
    });
  });

  it.each(portfolio.caseStudies)(
    "renders complete, sourced evidence for $slug",
    async (caseStudy) => {
      renderCaseStudy(caseStudy.slug);

      const title = await screen.findByRole("heading", {
        level: 1,
        name: caseStudy.title,
      });
      const article = title.closest("article");
      const header = title.closest("header");
      expect(article).not.toBeNull();
      expect(header).not.toBeNull();
      expect(
        within(article!).getAllByRole("heading", { level: 1 }),
      ).toHaveLength(1);
      expect(header).toHaveTextContent(caseStudy.organization);
      expect(header).toHaveTextContent(caseStudy.role);
      expect(header).toHaveTextContent(caseStudy.period);
      expect(header).toHaveTextContent(caseStudy.recruiterTakeaway);
      expect(header).toHaveTextContent(caseStudy.result);

      const expectedFeaturedProofId =
        expectedFeaturedProofByCaseId[caseStudy.id];
      const proof = expectedFeaturedProofId
        ? proofById(expectedFeaturedProofId)
        : undefined;
      const artifact = artifactById(caseStudy.artifactIds[0]);
      const sourceId = proof?.sourceIds[0] ?? artifact?.sourceIds[0];
      const source = sourceId ? sourceById(sourceId) : undefined;
      const expectedStatus = proof?.status ?? artifact?.status;

      expect(source).toBeDefined();
      expect(expectedStatus).toBeDefined();
      expect(header).toHaveTextContent(source!.title);
      expect(header).toHaveTextContent(expectedStatus!);
      if (proof) {
        expect(header).toHaveTextContent(proof.label);
        expect(header).toHaveTextContent(formatProofValue(proof));
      }

      const sections = ["Situation", "Action", "Result", "Evidence"].map(
        (name) =>
          within(article!).getByRole("region", {
            name,
          }),
      );
      expect(sections[0]).toHaveTextContent(caseStudy.situation);
      for (const action of caseStudy.actions) {
        expect(sections[1]).toHaveTextContent(action);
      }
      expect(sections[2]).toHaveTextContent(caseStudy.result);
      expect(sections[3]).toHaveTextContent(source!.title);
      expect(sections[3]).toHaveTextContent(expectedStatus!);
      expect(
        within(sections[3]).getByRole("img", { name: artifact!.alt }),
      ).toBeVisible();

      expect(
        within(article!).getByRole("group", {
          name: `Contact ${portfolio.candidate.name}`,
        }),
      ).toBeVisible();
      expect(
        within(article!).getByRole("link", { name: "Download CV" }),
      ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
      expect(
        within(article!).getByRole("link", { name: "Email" }),
      ).toHaveAttribute("href", `mailto:${portfolio.candidate.email}`);
    },
  );

  it.each(portfolio.caseStudies)(
    "provides stable, valid related-case navigation for $slug",
    async (caseStudy) => {
      renderCaseStudy(caseStudy.slug);

      await screen.findByRole("heading", {
        level: 1,
        name: caseStudy.title,
      });
      const related = screen.getByRole("region", {
        name: "Related case studies",
      });
      const expectedIds = expectedRelatedCaseIds[caseStudy.id];
      expect(expectedIds.length).toBeGreaterThan(0);
      expect(expectedIds).not.toContain(caseStudy.id);
      const links = within(related).getAllByRole("link");
      expect(links).toHaveLength(expectedIds.length);
      const expectedHrefs = expectedIds.map((relatedId) => {
        const expected = portfolio.caseStudies.find(
          (candidate) => candidate.id === relatedId,
        );
        expect(expected).toBeDefined();
        return `/case-studies/${expected!.slug}`;
      });
      expect(links.map((link) => link.getAttribute("href"))).toEqual(
        expectedHrefs,
      );
    },
  );

  it.each(portfolio.caseStudies)(
    "publishes unique metadata and truthful CreativeWork data for $slug",
    (caseStudy) => {
      const descriptors = meta({
        data: loader(loaderArgs(caseStudy.slug)),
      } as Parameters<typeof meta>[0]);
      expect(descriptors).toEqual([
        ...buildRouteMeta({ kind: "case-study", caseStudy }),
        {
          "script:ld+json": buildCreativeWorkJsonLd(
            caseStudy,
            portfolio.candidate,
          ),
        },
      ]);
    },
  );

  it("returns and renders a true, recoverable 404 for an invalid slug", async () => {
    expect(loader(loaderArgs("not-a-real-case-study"))).toMatchObject({
      data: null,
      init: { status: 404 },
    });

    renderCaseStudy("not-a-real-case-study");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Browse Projects" }),
    ).toHaveAttribute("href", "/playlist/projects");
    expect(
      screen.queryByText(portfolio.caseStudies[0].title),
    ).not.toBeInTheDocument();
  });
});
