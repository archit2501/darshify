import type { MetaFunction } from "react-router";
import { portfolio } from "../../src/content/portfolio";
import { ArtistPage } from "../../src/pages/ArtistPage";

export const meta: MetaFunction = () => [
  { title: `${portfolio.candidate.name} | Darshify` },
  { name: "description", content: portfolio.candidate.summary },
];

export default function ArtistRoute() {
  return <ArtistPage />;
}
