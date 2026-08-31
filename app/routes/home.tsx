import { useLoaderData, type MetaFunction } from "react-router";
import { currentGreeting } from "../../src/lib/greeting";
import { Home } from "../../src/pages/Home";

export function loader() {
  return { initialGreeting: currentGreeting() };
}

export const meta: MetaFunction = () => [
  { title: "Darshil Jain | Strategy & Operations Portfolio" },
  {
    name: "description",
    content:
      "Recruiter briefing for Darshil Jain: sourced experience across operations, recruitment, consulting, analytics, and student leadership.",
  },
];

export default function HomeRoute() {
  const { initialGreeting } = useLoaderData<typeof loader>();
  return <Home initialGreeting={initialGreeting} />;
}
