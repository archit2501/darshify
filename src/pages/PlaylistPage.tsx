import { useParams } from "react-router-dom";
import { playlists, trackById } from "../data/library";
import { useCareerMix } from "../career-mix/CareerMixContext";
import { TrackRow } from "../shell/TrackRow";
import { PlayButton } from "../shell/PlayButton";
import { Art } from "../shell/Art";
import { formatTime } from "../lib/format";
import { NotFound } from "./NotFound";

export function PlaylistPage() {
  const { id } = useParams();
  const { open } = useCareerMix();
  const pl = playlists.find((x) => x.id === id);
  if (!pl) return <NotFound />;

  const tracks = pl.trackIds.map(trackById).filter(Boolean) as NonNullable<
    ReturnType<typeof trackById>
  >[];
  const total = tracks.reduce((s, t) => s + t.durationSec, 0);

  return (
    <div>
      <header
        className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 pt-4 pb-6 -mx-4 md:-mx-6 px-4 md:px-6"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,.1), var(--color-panel)), ${pl.gradient}`,
        }}
      >
        <Art
          src={pl.cover}
          gradient={pl.gradient}
          alt={pl.title}
          className="w-40 h-40 md:w-52 md:h-52 rounded shadow-2xl shrink-0"
        />
        <div>
          <div className="text-xs font-bold uppercase tracking-wide">
            {pl.kind}
          </div>
          <h1 className="text-4xl md:text-7xl font-black my-3">{pl.title}</h1>
          <div className="text-sub">{pl.description}</div>
          <div className="text-sm mt-2">
            <span className="font-bold text-white">Darshil Jain</span> ·{" "}
            {tracks.length} songs · {formatTime(total)}
          </div>
        </div>
      </header>

      <div className="flex items-center gap-6 py-4">
        <PlayButton
          size={56}
          label="Start Career Mix"
          onClick={(event) => open(event.currentTarget)}
        />
      </div>

      <div className="grid grid-cols-[24px_1fr_auto_auto] md:grid-cols-[24px_1.6fr_1fr_auto_auto] gap-4 px-4 py-2 text-sub text-xs border-b border-white/10 mb-2">
        <span>#</span>
        <span>Title</span>
        <span className="hidden md:block">Plays</span>
        <span />
        <span className="text-right">⏱</span>
      </div>
      {tracks.map((t, i) => (
        <TrackRow key={t.id} track={t} index={i} />
      ))}
    </div>
  );
}
