import { usePlayer } from "../player/PlayerContext";
import { trackById, likedTrackIds } from "../data/library";
import { TrackRow } from "../shell/TrackRow";
import { PlayButton } from "../shell/PlayButton";

export function LikedSongs() {
  const p = usePlayer();
  // union of seeded achievements + anything the user liked, preserving order
  const ids = Array.from(new Set([...likedTrackIds, ...p.likes]));
  const tracks = ids.map(trackById).filter(Boolean) as NonNullable<ReturnType<typeof trackById>>[];
  const playing = p.isPlaying && tracks.some((t) => t.id === p.current?.id);

  return (
    <div>
      <header className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 pt-4 pb-6 -mx-4 md:-mx-6 px-4 md:px-6"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,.1), var(--color-panel)), linear-gradient(135deg,#4a00e0,#b3b3ff)" }}>
        <div className="w-40 h-40 md:w-52 md:h-52 rounded shadow-2xl grid place-items-center text-6xl shrink-0"
          style={{ background: "linear-gradient(135deg,#4a00e0,#b3b3ff)" }}>♥</div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide">Playlist</div>
          <h1 className="text-4xl md:text-7xl font-black my-3">Liked Songs</h1>
          <div className="text-sm"><span className="font-bold text-white">Darshil Jain</span> · {tracks.length} songs · the achievements on repeat</div>
        </div>
      </header>

      <div className="flex items-center gap-6 py-4">
        <PlayButton size={56} playing={playing}
          onClick={() => (playing ? p.toggle() : tracks[0] && p.play(tracks[0], ids))} />
      </div>

      {tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} context={ids} />)}
    </div>
  );
}
