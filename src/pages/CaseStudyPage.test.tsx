import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createMemoryRouter,
  RouterProvider,
  type LoaderFunctionArgs,
} from "react-router";
import { portfolio } from "../content/portfolio";
import { artifactById, proofById, sourceById } from "../content/selectors";
import CaseStudyRoute, { loader, meta } from "../../app/routes/case-study";

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

      const proof = caseStudy.proofIds[0]
        ? proofById(caseStudy.proofIds[0])
        : undefined;
      const artifact = artifactById(caseStudy.artifactIds[0]);
      const sourceId = proof?.sourceIds[0] ?? artifact?.sourceIds[0];
      const source = sourceId ? sourceById(sourceId) : undefined;
      const expectedStatus = proof?.status ?? artifact?.status;

      expect(source).toBeDefined();
      expect(expectedStatus).toBeDefined();
      expect(header).toHaveTextContent(source!.title);
      expect(header).toHaveTextContent(expectedStatus!);

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
    "publishes unique metadata and truthful CreativeWork data for $slug",
    (caseStudy) => {
      const descriptors = meta({
        data: loader(loaderArgs(caseStudy.slug)),
      } as Parameters<typeof meta>[0]);
      const canonical = `/case-studies/${caseStudy.slug}`;

      expect(descriptors).toContainEqual({
        title: `${caseStudy.title} | Darshify`,
      });
      expect(descriptors).toContainEqual({
        name: "description",
        content: caseStudy.recruiterTakeaway,
      });
      expect(descriptors).toContainEqual({
        tagName: "link",
        rel: "canonical",
        href: canonical,
      });
      expect(descriptors).toContainEqual({
        property: "og:title",
        content: caseStudy.title,
      });
      expect(descriptors).toContainEqual({
        property: "og:description",
        content: caseStudy.recruiterTakeaway,
      });
      expect(descriptors).toContainEqual({
        property: "og:url",
        content: canonical,
      });
      expect(descriptors).toContainEqual({
        property: "og:type",
        content: "article",
      });
      expect(descriptors).toContainEqual({
        "script:ld+json": expect.objectContaining({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: caseStudy.title,
          description: caseStudy.recruiterTakeaway,
          creator: expect.objectContaining({
            "@type": "Person",
            name: portfolio.candidate.name,
          }),
        }),
      });
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
