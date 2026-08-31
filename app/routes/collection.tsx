import {
  data,
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { portfolio } from "../../src/content/portfolio";
import { LikedSongs } from "../../src/pages/LikedSongs";
import { PlaylistPage } from "../../src/pages/PlaylistPage";
import { NotFoundView } from "./not-found";

type CollectionRouteData =
  | { kind: "liked"; title: "Achievements"; description: string }
  | { kind: "collection"; title: string; description: string };

export function loader({ params, request }: LoaderFunctionArgs) {
  if (new URL(request.url).pathname === "/liked") {
    const achievements = portfolio.collections.find(
      ({ id }) => id === "achievements",
    );
    return {
      kind: "liked",
      title: "Achievements",
      description:
        achievements?.description ?? "Portfolio achievements and recognition.",
    } satisfies CollectionRouteData;
  }

  const collection = portfolio.collections.find(({ id }) => id === params.id);
  if (!collection) return data(null, { status: 404 });

  return {
    kind: "collection",
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
  return routeData.kind === "liked" ? <LikedSongs /> : <PlaylistPage />;
}
