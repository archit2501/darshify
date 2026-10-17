import {
  data,
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { portfolio } from "../../src/content/portfolio";
import { GenrePage } from "../../src/pages/GenrePage";
import { buildNotFoundMeta, buildRouteMeta } from "../../src/seo/meta";
import { NotFoundView } from "./not-found";

export function loader({ params }: LoaderFunctionArgs) {
  const genre = portfolio.genres.find((item) => item.slug === params.slug);
  return genre ?? data(null, { status: 404 });
}

export const meta: MetaFunction<typeof loader> = ({ data: genre }) =>
  genre
    ? buildRouteMeta({ kind: "genre", genre })
    : buildNotFoundMeta("The requested Darshify skill could not be found.");

export default function GenreRoute() {
  const genre = useLoaderData<typeof loader>();
  if (!genre) return <NotFoundView />;
  return <GenrePage genre={genre} />;
}
