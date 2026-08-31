import {
  data,
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { portfolio } from "../../src/content/portfolio";
import { caseStudyBySlug } from "../../src/content/selectors";
import { CaseStudyPage } from "../../src/pages/CaseStudyPage";
import { NotFoundView } from "./not-found";

export function loader({ params }: LoaderFunctionArgs) {
  const caseStudy = caseStudyBySlug(params.slug ?? "");
  return caseStudy ?? data(null, { status: 404 });
}

export const meta: MetaFunction<typeof loader> = ({ data: caseStudy }) => {
  if (!caseStudy) {
    return [
      { title: "Case study not found | Darshify" },
      {
        name: "description",
        content: "The requested Darshify case study could not be found.",
      },
      { name: "robots", content: "noindex" },
    ];
  }

  const canonical = `/case-studies/${caseStudy.slug}`;

  return [
    { title: `${caseStudy.title} | Darshify` },
    { name: "description", content: caseStudy.recruiterTakeaway },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: caseStudy.title },
    { property: "og:description", content: caseStudy.recruiterTakeaway },
    { property: "og:url", content: canonical },
    { property: "og:type", content: "article" },
    { property: "og:image", content: "/og.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: caseStudy.title },
    { name: "twitter:description", content: caseStudy.recruiterTakeaway },
    { name: "twitter:image", content: "/og.png" },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: caseStudy.title,
        description: caseStudy.recruiterTakeaway,
        url: canonical,
        genre: caseStudy.kind,
        temporalCoverage: caseStudy.period,
        keywords: caseStudy.skills,
        creator: {
          "@type": "Person",
          name: portfolio.candidate.name,
        },
      },
    },
  ];
};

export default function CaseStudyRoute() {
  const caseStudy = useLoaderData<typeof loader>();
  if (!caseStudy) return <NotFoundView />;
  return <CaseStudyPage caseStudy={caseStudy} />;
}
