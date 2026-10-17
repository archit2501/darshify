import { useId } from "react";
import { Link } from "react-router-dom";
import { artistArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import { caseStudyById } from "../content/selectors";
import { usePlaybackClock, usePlayer, usePlayerActions } from "../player/hooks";
import { activeCueIndex, trackById } from "../player/tracks";
import { Cover } from "./Cover";

// The cards under the art in both Now Playing views: the docked desktop
// panel and the phone's full-screen player.

const card = "rounded-panel bg-surface-hi p-4";

/** The lyrics in the song's colour; the sung line is white and any line seeks. */
export function LyricsCard({
  trackId,
  color,
  onShowLyrics,
}: {
  trackId: string;
  color: string;
  /** Runs after the full lyrics view opens (the phone sheet closes itself). */
  onShowLyrics?: () => void;
}) {
  const id = useId();
  const active = usePlaybackClock((state, elapsed) =>
    state.currentId === trackId
      ? activeCueIndex(trackById(trackId)!.cues, elapsed)
      : -1,
  );
  const { seek, toggleLyrics } = usePlayerActions();
  const track = trackById(trackId)!;
  return (
    <section
      aria-labelledby={id}
      className="rounded-panel p-4"
      style={{ backgroundColor: color }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 id={id} className="font-bold">
          Lyrics
        </h3>
        <button
          type="button"
          onClick={() => {
            toggleLyrics();
            onShowLyrics?.();
          }}
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

/** Who did what, where and when, with the résumé as the source. */
export function CreditsList({ songId }: { songId: string }) {
  const song = caseStudyById(songId);
  if (!song) return null;
  return (
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
  );
}

export function CreditsCard({ songId }: { songId: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={card}>
      <h3 id={id} className="mb-3 font-bold">
        Credits
      </h3>
      <CreditsList songId={songId} />
    </section>
  );
}

/** The artist card: photo or cover, the summary and "Connect" (LinkedIn). */
export function ArtistCard({ onNavigate }: { onNavigate?: () => void }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="overflow-hidden rounded-panel bg-surface-hi"
    >
      <div className="relative">
        <Cover
          art={artistArt}
          portrait={portfolio.candidate.portrait}
          size="fill"
          className="aspect-[16/10]"
        />
        <h3 id={id} className="absolute top-3 left-4 font-bold drop-shadow">
          About the artist
        </h3>
      </div>
      <div className="space-y-2 p-4">
        <Link
          to="/artist"
          onClick={onNavigate}
          className="font-bold hover:underline"
        >
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
          Connect
        </a>
      </div>
    </section>
  );
}

/** What plays next: the first queued song, else the next in the list. */
export function NextInQueueCard({
  onNavigate,
  showQueueButton = true,
}: {
  onNavigate?: () => void;
  showQueueButton?: boolean;
}) {
  const id = useId();
  const nextId = usePlayer(
    (state) =>
      state.queue[0] ??
      state.context.trackIds[state.order[state.position + 1] ?? -1] ??
      null,
  );
  const { togglePanel } = usePlayerActions();
  const next = nextId ? trackById(nextId) : undefined;
  return (
    <section aria-labelledby={id} className={card}>
      <div className="mb-3 flex items-center justify-between">
        <h3 id={id} className="font-bold">
          Next in queue
        </h3>
        {showQueueButton ? (
          <button
            type="button"
            onClick={() => togglePanel("queue")}
            className="text-sm font-bold text-subdued hover:text-fg hover:underline"
          >
            Open queue
          </button>
        ) : null}
      </div>
      {next ? (
        <Link
          to={next.href}
          onClick={onNavigate}
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
