import { useState } from "react";
import { artist, tracks, playlists, ARTIST_HERO } from "../data/library";
import { usePlayer } from "../player/PlayerContext";
import { PlayButton } from "../shell/PlayButton";
import { TrackRow } from "../shell/TrackRow";
import { MediaCard } from "../shell/MediaCard";
import { Art } from "../shell/Art";
import { formatPlays } from "../lib/format";
import { contact } from "../data/library";

export function ArtistPage() {
  const p = usePlayer();
  const [following, setFollowing] = useState(false);
  const allIds = tracks.map((t) => t.id);
  const popular = [...tracks].sort((a, b) => b.plays - a.plays).slice(0, 6);
  const playing = p.isPlaying && allIds.includes(p.current?.id ?? "");

  return (
    <div className="-mx-4 md:-mx-6">
      {/* hero */}
      <header className="relative h-80 flex items-end p-6 overflow-hidden">
        <Art src={ARTIST_HERO} gradient={artist.gradient} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.1) 40%, var(--color-panel))" }} />
        <div className="relative z-10">
          <div className="text-xs font-bold">✓ Verified Candidate</div>
          <h1 className="text-5xl md:text-8xl font-black my-2 drop-shadow-lg">{artist.name}</h1>
          <div className="text-white/90">{formatPlays(artist.monthlyListeners)} monthly listeners</div>
        </div>
      </header>

      <div className="px-6">
        <div className="flex items-center gap-6 py-5">
          <PlayButton size={56} playing={playing} onClick={() => (playing ? p.toggle() : p.play(popular[0], allIds))} />
          <button onClick={() => setFollowing((f) => !f)}
            className={`rounded-full px-5 py-1.5 text-sm font-bold border ${following ? "border-white" : "border-sub text-sub hover:border-white hover:text-white"}`}>
            {following ? "Following" : "Follow"}
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-2">Popular</h2>
        {popular.map((t, i) => <TrackRow key={t.id} track={t} index={i} context={allIds} />)}

        <h2 className="text-2xl font-bold mt-8 mb-3">Discography</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {playlists.map((pl) => (
            <MediaCard key={pl.id} to={`/playlist/${pl.id}`} title={pl.title} subtitle={`${pl.kind} · Darshil Jain`}
              gradient={pl.gradient} cover={pl.cover} onPlay={() => p.play(tracks.find((t) => t.id === pl.trackIds[0])!, pl.trackIds)} />
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-3">About</h2>
        <div className="rounded-lg bg-card p-6 max-w-2xl">
          <p className="text-sub leading-relaxed">{artist.about}</p>
          <p className="mt-3 text-sm text-sub">{artist.tagline}</p>
          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            <a href="/Darshil_Jain_Resume.pdf" download className="bg-accent text-black font-bold rounded-full px-4 py-2">↓ Download CV</a>
            <a href={`mailto:${contact.email}`} className="border border-sub/50 rounded-full px-4 py-2 hover:border-white">Email</a>
            <a href={contact.linkedin} target="_blank" rel="noreferrer" className="border border-sub/50 rounded-full px-4 py-2 hover:border-white">LinkedIn</a>
          </div>
        </div>
      </div>
    </div>
  );
}
