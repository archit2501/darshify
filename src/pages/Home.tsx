import { useEffect, useRef, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import {
  playlists,
  tracks,
  trackById,
  coverFor,
  AVATAR,
  LIKED_COVER,
} from "../data/library";
import { usePlayer } from "../player/PlayerContext";
import { Shelf } from "../shell/Shelf";
import { MediaCard } from "../shell/MediaCard";
import { Art } from "../shell/Art";
import { currentGreeting } from "../lib/greeting";

const subscribeToClock = () => () => {};

export function Home({ initialGreeting }: { initialGreeting: string }) {
  const p = usePlayer();
  const nav = useNavigate();
  const h1 = useRef<HTMLHeadingElement>(null);
  const greeting = useSyncExternalStore(
    subscribeToClock,
    currentGreeting,
    () => initialGreeting,
  );
  useEffect(() => {
    h1.current?.focus();
  }, []);

  const quick = [
    {
      to: "/artist",
      title: "This Is Darshil",
      gradient: "linear-gradient(135deg,#1ed760,#0a5)",
      cover: AVATAR,
      ctx: tracks.map((t) => t.id),
    },
    {
      to: "/playlist/skills",
      title: "Top Skills",
      gradient: "linear-gradient(135deg,#ff4d6d,#7b2ff7)",
      cover: playlists[2].cover,
      ctx: playlists[2].trackIds,
    },
    {
      to: "/playlist/experience",
      title: "Experience",
      gradient: "linear-gradient(135deg,#36c6ff,#2536ff)",
      cover: playlists[0].cover,
      ctx: playlists[0].trackIds,
    },
    {
      to: "/liked",
      title: "Liked Songs",
      gradient: "linear-gradient(135deg,#4a00e0,#b3b3ff)",
      cover: LIKED_COVER,
      ctx: ["a1", "a2", "a3", "a4"],
    },
    {
      to: "/playlist/projects",
      title: "Projects",
      gradient: "linear-gradient(135deg,#8e2de2,#4a00e0)",
      cover: playlists[1].cover,
      ctx: playlists[1].trackIds,
    },
    {
      to: "/playlist/certs",
      title: "Certifications",
      gradient: "linear-gradient(135deg,#1ed760,#0a5)",
      cover: playlists[3].cover,
      ctx: playlists[3].trackIds,
    },
  ];

  const topHits = [...tracks].sort((a, b) => b.plays - a.plays).slice(0, 6);

  return (
    <div className="pt-2">
      <h1
        ref={h1}
        tabIndex={-1}
        className="text-3xl font-black outline-none mb-5"
      >
        {greeting}
      </h1>

      {/* quick picks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {quick.map((q) => (
          <div
            key={q.to}
            onClick={() => nav(q.to)}
            className="group relative flex items-center gap-4 bg-white/10 hover:bg-white/20 rounded-md overflow-hidden cursor-pointer transition-colors"
          >
            <Art
              src={q.cover}
              gradient={q.gradient}
              alt={q.title}
              className="w-16 h-16 shrink-0"
            />
            <span className="font-bold">{q.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const t = trackById(q.ctx[0]);
                if (t) p.play(t, q.ctx);
              }}
              aria-label={`Play ${q.title}`}
              className="ml-auto mr-4 opacity-0 group-hover:opacity-100 grid place-items-center w-11 h-11 rounded-full bg-accent text-black shadow-lg transition-opacity"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
            </button>
          </div>
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
            onPlay={() => {
              const t = trackById(pl.trackIds[0]);
              if (t) p.play(t, pl.trackIds);
            }}
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
            onPlay={() =>
              p.play(
                t,
                topHits.map((x) => x.id),
              )
            }
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
          onPlay={() =>
            p.play(
              tracks[0],
              tracks.map((t) => t.id),
            )
          }
        />
        {playlists.slice(0, 2).map((pl) => (
          <MediaCard
            key={pl.id}
            to={`/playlist/${pl.id}`}
            title={pl.title}
            subtitle={pl.kind}
            gradient={pl.gradient}
            cover={pl.cover}
            onPlay={() => {
              const t = trackById(pl.trackIds[0]);
              if (t) p.play(t, pl.trackIds);
            }}
          />
        ))}
      </Shelf>
    </div>
  );
}
