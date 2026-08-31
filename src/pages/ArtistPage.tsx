import { artist, trackById, playlists, ARTIST_HERO } from "../data/library";
import { useCareerMix } from "../career-mix/CareerMixContext";
import { PlayButton } from "../shell/PlayButton";
import { TrackRow } from "../shell/TrackRow";
import { MediaCard } from "../shell/MediaCard";
import { Art } from "../shell/Art";
import { ContactActions } from "../components/ContactActions";
import { portfolio } from "../content/portfolio";

export function ArtistPage() {
  const { open } = useCareerMix();
  const highlights = portfolio.caseStudies
    .slice(0, 6)
    .map((caseStudy) => trackById(caseStudy.id))
    .filter(Boolean) as NonNullable<ReturnType<typeof trackById>>[];

  return (
    <div className="-mx-4 md:-mx-6">
      {/* hero */}
      <header className="relative h-80 flex items-end p-6 overflow-hidden">
        <Art
          src={ARTIST_HERO}
          gradient={artist.gradient}
          className="absolute inset-0 w-full h-full"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.1) 40%, var(--color-panel))",
          }}
        />
        <div className="relative z-10">
          <div className="text-xs font-bold">✓ Verified Candidate</div>
          <h1 className="text-5xl md:text-8xl font-black my-2 drop-shadow-lg">
            {artist.name}
          </h1>
          <div className="text-white/90">{portfolio.candidate.headline}</div>
        </div>
      </header>

      <div className="px-6">
        <div className="flex items-center gap-6 py-5">
          <PlayButton
            size={56}
            label="Start Career Mix"
            onClick={(event) => open(event.currentTarget)}
          />
        </div>

        <h2 className="text-2xl font-bold mb-2">Selected evidence</h2>
        {highlights.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} />
        ))}

        <h2 className="text-2xl font-bold mt-8 mb-3">Evidence collections</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
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
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-3">About</h2>
        <div className="rounded-lg bg-card p-6 max-w-2xl">
          <p className="text-sub leading-relaxed">{artist.about}</p>
          <p className="mt-3 text-sm text-sub">{artist.tagline}</p>
          <div className="mt-4">
            <ContactActions candidate={portfolio.candidate} placement="hero" />
          </div>
        </div>
      </div>
    </div>
  );
}
