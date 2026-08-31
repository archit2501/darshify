import {
  data,
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { portfolio } from "../../src/content/portfolio";
import { caseStudyBySlug } from "../../src/content/selectors";
import { CaseStudyPage } from "../../src/pages/CaseStudyPage";
import { buildNotFoundMeta, buildRouteMeta } from "../../src/seo/meta";
import { buildCreativeWorkJsonLd } from "../../src/seo/structuredData";
import { NotFoundView } from "./not-found";

export function loader({ params }: LoaderFunctionArgs) {
  const caseStudy = caseStudyBySlug(params.slug ?? "");
  return caseStudy ?? data(null, { status: 404 });
}

export const meta: MetaFunction<typeof loader> = ({ data: caseStudy }) => {
  if (!caseStudy) {
    return buildNotFoundMeta(
      "The requested Darshify case study could not be found.",
    );
  }

  return [
    ...buildRouteMeta({ kind: "case-study", caseStudy }),
    {
      "script:ld+json": buildCreativeWorkJsonLd(caseStudy, portfolio.candidate),
    },
  ];
};

export default function CaseStudyRoute() {
  const caseStudy = useLoaderData<typeof loader>();
  if (!caseStudy) return <NotFoundView />;
  return <CaseStudyPage caseStudy={caseStudy} />;
}
