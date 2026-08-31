import {
  data,
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { caseStudyBySlug } from "../../src/content/selectors";
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
    ];
  }

  return [
    { title: `${caseStudy.title} | Darshify` },
    { name: "description", content: caseStudy.recruiterTakeaway },
  ];
};

export default function CaseStudyRoute() {
  const caseStudy = useLoaderData<typeof loader>();
  if (!caseStudy) return <NotFoundView />;

  return (
    <article className="mx-auto max-w-3xl py-8">
      <header className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-sub">
          Case study
        </p>
        <h1 className="text-4xl font-black md:text-6xl">{caseStudy.title}</h1>
        <p className="mt-4 text-sub">
          <span className="text-white">{caseStudy.organization}</span> ·{" "}
          {caseStudy.role} · <span>{caseStudy.period}</span>
        </p>
      </header>

      <section aria-labelledby="recruiter-takeaway">
        <h2 id="recruiter-takeaway" className="mb-2 text-2xl font-bold">
          Recruiter takeaway
        </h2>
        <p className="text-lg leading-relaxed text-sub">
          {caseStudy.recruiterTakeaway}
        </p>
      </section>

      <Link
        to="/playlist/projects"
        className="mt-8 inline-block rounded-full border border-sub/50 px-5 py-2 font-bold hover:border-white"
      >
        Back to Projects
      </Link>
    </article>
  );
}
