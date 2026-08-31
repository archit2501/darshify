import {
  data,
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { collectionById } from "../../src/content/selectors";
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

  const collection = collectionById(params.id);
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

  const canonicalHref =
    routeData.kind === "liked" || routeData.id === "achievements"
      ? "/liked"
      : `/playlist/${routeData.id}`;
  return [
    { title: `${routeData.title} | Darshify` },
    { name: "description", content: routeData.description },
    { tagName: "link", rel: "canonical", href: canonicalHref },
  ];
};

export default function CollectionRoute() {
  const routeData = useLoaderData<typeof loader>();
  if (!routeData) return <NotFoundView />;
  if (routeData.kind === "liked") return <LikedSongs />;
  return <PlaylistPage />;
}
