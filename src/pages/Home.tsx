import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import {
  playlists,
  tracks,
  coverFor,
  AVATAR,
  LIKED_COVER,
} from "../data/library";
import { useCareerMix } from "../career-mix/CareerMixContext";
import { PlayIcon } from "../icons/icons";
import { Shelf } from "../shell/Shelf";
import { MediaCard } from "../shell/MediaCard";
import { Art } from "../shell/Art";
import { currentGreeting } from "../lib/greeting";

const subscribeToClock = () => () => {};

export function Home({ initialGreeting }: { initialGreeting: string }) {
  const { open } = useCareerMix();
  const greeting = useSyncExternalStore(
    subscribeToClock,
    currentGreeting,
    () => initialGreeting,
  );

  const quick = [
    {
      to: "/artist",
      title: "This Is Darshil",
      gradient: "linear-gradient(135deg,#1ed760,#0a5)",
      cover: AVATAR,
    },
    {
      to: "/playlist/skills",
      title: "Top Skills",
      gradient: "linear-gradient(135deg,#ff4d6d,#7b2ff7)",
      cover: playlists[2].cover,
    },
    {
      to: "/playlist/experience",
      title: "Experience",
      gradient: "linear-gradient(135deg,#36c6ff,#2536ff)",
      cover: playlists[0].cover,
    },
    {
      to: "/liked",
      title: "Liked Songs",
      gradient: "linear-gradient(135deg,#4a00e0,#b3b3ff)",
      cover: LIKED_COVER,
    },
    {
      to: "/playlist/projects",
      title: "Projects",
      gradient: "linear-gradient(135deg,#8e2de2,#4a00e0)",
      cover: playlists[1].cover,
    },
    {
      to: "/playlist/certs",
      title: "Certifications",
      gradient: "linear-gradient(135deg,#1ed760,#0a5)",
      cover: playlists[3].cover,
    },
  ];

  const topHits = [...tracks].sort((a, b) => b.plays - a.plays).slice(0, 6);

  return (
    <div className="pt-2">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">{greeting}</h1>
        <button
          type="button"
          onClick={(event) => open(event.currentTarget)}
          data-motion-transform
          className="interactive-target inline-flex items-center justify-center gap-2 rounded-full bg-signal px-4 font-bold text-black motion-safe:hover:scale-[1.02]"
        >
          <PlayIcon />
          Start Career Mix
        </button>
      </div>

      {/* quick picks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {quick.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="group relative flex items-center gap-4 overflow-hidden rounded-md bg-white/10 transition-colors hover:bg-white/20"
          >
            <Art
              src={q.cover}
              gradient={q.gradient}
              alt={q.title}
              className="w-16 h-16 shrink-0"
            />
            <span className="font-bold">{q.title}</span>
          </Link>
        ))}
      </div>

      <Shelf title="Made for Recruiters" to="/library">
        {playlists.map((pl) => (
          <MediaCard
            key={pl.id}
            to={`/playlist/${pl.id}`}
            title={pl.title}
            subtitle={pl.description}
            gradient={pl.gradient}
            cover={pl.cover}
          />
        ))}
      </Shelf>

      <Shelf title="Your Top Hits" to="/artist">
        {topHits.map((t) => (
          <MediaCard
            key={t.id}
            to="/artist"
            title={t.title}
            subtitle={t.subtitle}
            gradient={t.gradient}
            cover={coverFor(t.kind)}
          />
        ))}
      </Shelf>

      <Shelf title="Jump back in" to="/library">
        <MediaCard
          to="/artist"
          title="This Is Darshil"
          subtitle="The essential tracks"
          round
          gradient="linear-gradient(135deg,#1ed760,#0a5)"
          cover={AVATAR}
        />
        {playlists.slice(0, 2).map((pl) => (
          <MediaCard
            key={pl.id}
            to={`/playlist/${pl.id}`}
            title={pl.title}
            subtitle={pl.kind}
            gradient={pl.gradient}
            cover={pl.cover}
          />
        ))}
      </Shelf>
    </div>
  );
}
