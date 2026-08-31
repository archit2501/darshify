import {
  data,
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { portfolio } from "../../src/content/portfolio";
import { caseStudyById } from "../../src/content/selectors";
import { LikedSongs } from "../../src/pages/LikedSongs";
import { PlaylistPage } from "../../src/pages/PlaylistPage";
import { NotFoundView } from "./not-found";

type CollectionRouteData =
  | { kind: "liked"; title: "Selected achievements"; description: string }
  | {
      kind: "collection";
      id: string;
      title: string;
      description: string;
    };

export function loader({ params }: LoaderFunctionArgs) {
  if (params.id === undefined) {
    return {
      kind: "liked",
      title: "Selected achievements",
      description:
        "Darshil Jain's selected achievements and competition recognition.",
    } satisfies CollectionRouteData;
  }

  const collection = portfolio.collections.find(({ id }) => id === params.id);
  if (!collection) return data(null, { status: 404 });

  return {
    kind: "collection",
    id: collection.id,
    title: collection.title,
    description: collection.description,
  } satisfies CollectionRouteData;
}

export const meta: MetaFunction<typeof loader> = ({ data: routeData }) => {
  if (!routeData) {
    return [
      { title: "Page not found | Darshify" },
      {
        name: "description",
        content: "The requested portfolio collection could not be found.",
      },
    ];
  }

  return [
    { title: `${routeData.title} | Darshify` },
    { name: "description", content: routeData.description },
  ];
};

export default function CollectionRoute() {
  const routeData = useLoaderData<typeof loader>();
  if (!routeData) return <NotFoundView />;
  if (routeData.kind === "liked") return <LikedSongs />;
  if (["experience", "projects", "skills", "certs"].includes(routeData.id)) {
    return <PlaylistPage />;
  }

  const collection = portfolio.collections.find(
    ({ id }) => id === routeData.id,
  );
  if (!collection) return <NotFoundView />;
  const caseStudies = collection.caseStudyIds
    .map(caseStudyById)
    .filter((caseStudy) => caseStudy !== undefined);

  return (
    <section className="py-8">
      <header className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-sub">
          Portfolio collection
        </p>
        <h1 className="text-4xl font-black md:text-6xl">{collection.title}</h1>
        <p className="mt-3 text-sub">{collection.description}</p>
      </header>
      <ul className="grid gap-3">
        {caseStudies.map((caseStudy) => (
          <li key={caseStudy.id}>
            <Link
              to={`/case-studies/${caseStudy.slug}`}
              className="block rounded-lg bg-white/5 p-4 font-bold hover:bg-white/10"
            >
              {caseStudy.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
