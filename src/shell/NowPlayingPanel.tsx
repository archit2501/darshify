import { Link } from "react-router-dom";
import { artistArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import { caseStudyById } from "../content/selectors";
import { CloseIcon } from "../icons/icons";
import { usePlaybackClock, usePlayer, usePlayerActions } from "../player/hooks";
import { activeCueIndex, trackById } from "../player/tracks";
import { Cover } from "./Cover";
import { IconButton } from "./IconButton";
import { Visualizer } from "./Visualizer";

const card = "rounded-panel bg-surface-hi p-4";

/**
 * The right-hand Now Playing view: the song's art (with a looping
 * visualizer while it plays), its lyrics in sync, credits with the source,
 * the artist card and what plays next.
 */
export function NowPlayingPanel() {
  const contextTitle = usePlayer((state) => state.context.title);
  const contextHref = usePlayer((state) => state.context.href);
  const currentId = usePlayer((state) => state.currentId);
  const playing = usePlayer((state) => state.status === "playing");
  const { closePanel } = usePlayerActions();
  const track = trackById(currentId);
  const song = caseStudyById(currentId);
  if (!track || !song) return null;

  return (
    <aside
      aria-label="Now playing view"
      className="scroll-area flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-panel bg-surface p-4"
    >
      <header className="flex items-center gap-2">
        <Link
          to={contextHref}
          className="min-w-0 flex-1 truncate font-bold text-fg hover:underline"
        >
          {contextTitle}
        </Link>
        <IconButton label="Hide now playing view" onClick={closePanel}>
          <CloseIcon size={16} />
        </IconButton>
      </header>

      <div className="relative">
        <Cover art={track.art} size="fill" priority />
        <Visualizer color={track.art.color} active={playing} />
      </div>

      <div>
        <h2 className="text-title">
          <Link to={track.href} className="hover:underline">
            {track.title}
          </Link>
        </h2>
        <p className="text-subdued">
          <Link to="/artist" className="hover:text-fg hover:underline">
            {portfolio.candidate.name}
          </Link>{" "}
          · {track.subtitle}
        </p>
      </div>

      <LyricsCard trackId={track.id} color={track.art.color} />

      <section aria-labelledby="np-credits" className={card}>
        <h3 id="np-credits" className="mb-3 font-bold">
          Credits
        </h3>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-fg">{song.role}</dt>
            <dd className="text-subdued">Darshil Jain</dd>
          </div>
          <div>
            <dt className="text-fg">{song.organization}</dt>
            <dd className="text-subdued">{song.team ?? "Organization"}</dd>
          </div>
          {song.period ? (
            <div>
              <dt className="text-fg">{song.period}</dt>
              <dd className="text-subdued">Released</dd>
            </div>
          ) : null}
          <div>
            <dt>
              <a
                href={portfolio.candidate.resumeUrl}
                className="text-fg hover:underline"
              >
                Darshil Jain résumé (PDF)
              </a>
            </dt>
            <dd className="text-subdued">Source</dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="np-artist"
        className="overflow-hidden rounded-panel bg-surface-hi"
      >
        <div className="relative">
          <Cover
            art={artistArt}
            portrait={portfolio.candidate.portrait}
            size="fill"
            className="aspect-[16/10]"
          />
          <h3
            id="np-artist"
            className="absolute top-3 left-4 font-bold drop-shadow"
          >
            About the artist
          </h3>
        </div>
        <div className="space-y-2 p-4">
          <Link to="/artist" className="font-bold hover:underline">
            {portfolio.candidate.name}
          </Link>
          <p className="line-clamp-3 text-sm text-subdued">
            {portfolio.candidate.summary}
          </p>
          <a
            href={portfolio.candidate.linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center rounded-full border border-icon-off px-4 text-sm font-bold transition-[border-color,transform] hover:border-fg motion-safe:hover:scale-104"
          >
            Follow
          </a>
        </div>
      </section>

      <NextInQueue />
    </aside>
  );
}

function LyricsCard({ trackId, color }: { trackId: string; color: string }) {
  const active = usePlaybackClock((state, elapsed) =>
    state.currentId === trackId
      ? activeCueIndex(trackById(trackId)!.cues, elapsed)
      : -1,
  );
  const { seek, toggleLyrics } = usePlayerActions();
  const track = trackById(trackId)!;
  return (
    <section
      aria-labelledby="np-lyrics"
      className="rounded-panel p-4"
      style={{ backgroundColor: color }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 id="np-lyrics" className="font-bold">
          Lyrics
        </h3>
        <button
          type="button"
          onClick={toggleLyrics}
          className="rounded-full bg-black/20 px-3 py-1 text-xs font-bold hover:bg-black/30"
        >
          Show lyrics
        </button>
      </div>
      <ol className="space-y-2 text-lg leading-snug font-bold">
        {track.cues.map((cue, index) => (
          <li key={cue.startMs}>
            <button
              type="button"
              onClick={() => seek(cue.startMs)}
              aria-current={index === active ? "true" : undefined}
              className={`text-left transition-colors duration-(--dur-reveal) ${index === active ? "text-fg" : index < active ? "text-white/70" : "text-black/55 hover:text-white/80"}`}
            >
              {cue.text}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NextInQueue() {
  const nextId = usePlayer(
    (state) =>
      state.queue[0] ??
      state.context.trackIds[state.order[state.position + 1] ?? -1] ??
      null,
  );
  const { togglePanel } = usePlayerActions();
  const next = nextId ? trackById(nextId) : undefined;
  return (
    <section aria-labelledby="np-next" className={card}>
      <div className="mb-3 flex items-center justify-between">
        <h3 id="np-next" className="font-bold">
          Next in queue
        </h3>
        <button
          type="button"
          onClick={() => togglePanel("queue")}
          className="text-sm font-bold text-subdued hover:text-fg hover:underline"
        >
          Open queue
        </button>
      </div>
      {next ? (
        <Link
          to={next.href}
          className="flex items-center gap-3 rounded-row p-1 hover:bg-tint"
        >
          <Cover art={next.art} size="sm" />
          <span className="min-w-0">
            <span className="block truncate">{next.title}</span>
            <span className="block truncate text-sm text-subdued">
              {next.subtitle}
            </span>
          </span>
        </Link>
      ) : (
        <p className="text-sm text-subdued">That's the end of this list.</p>
      )}
    </section>
  );
}
