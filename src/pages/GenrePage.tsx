import { useRef } from "react";
import { ActionBar } from "../components/ActionBar";
import { MediaCard } from "../components/MediaCard";
import { ReleaseBody, ReleaseHeader } from "../components/ReleaseHeader";
import { Shelf } from "../components/Shelf";
import { TrackTable } from "../components/TrackTable";
import { genreArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import { caseStudyById } from "../content/selectors";
import { yearSpan } from "../content/songFacts";
import type { Genre } from "../content/types";
import { genreContext, trackById } from "../player/tracks";
import { PlayButton } from "../shell/PlayButton";
import { StickyHeader } from "../shell/StickyHeader";
import { formatListLength } from "../shell/time";

/**
 * A skill as a genre page: its colour and description, every song where
 * Darshil used it (from the résumé), and the other skills to browse.
 */
export function GenrePage({ genre }: { genre: Genre }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const context = genreContext(genre);
  const songs = context.trackIds.flatMap((id) => caseStudyById(id) ?? []);
  const art = genreArt(genre);
  const years = yearSpan(songs);
  const totalMs = context.trackIds.reduce(
    (sum, id) => sum + (trackById(id)?.durationMs ?? 0),
    0,
  );
  const count = `${songs.length} ${songs.length === 1 ? "song" : "songs"}, ${formatListLength(totalMs)}`;
  const others = portfolio.genres.filter((other) => other.slug !== genre.slug);

  return (
    <div className="flex flex-col">
      <StickyHeader
        sentinel={sentinel}
        color={art.color}
        title={genre.skill}
        action={<PlayButton context={context} label={genre.skill} size={48} />}
      />
      <ReleaseHeader
        type="Skill"
        title={genre.skill}
        description={genre.description}
        art={art}
        meta={years ? [years, count] : [count]}
      />
      <div ref={sentinel} aria-hidden="true" />
      <ReleaseBody color={art.color}>
        <ActionBar context={context} label={genre.skill} />
        {songs.length > 0 ? (
          <TrackTable
            songs={songs}
            context={context}
            label={`Songs that use ${genre.skill}`}
          />
        ) : (
          <p className="text-subdued">
            The résumé lists {genre.skill} as a skill without tying it to one
            role or project.
          </p>
        )}
        <div className="-mx-3 mt-12">
          <Shelf title="More skills" href="/search">
            {others.map((other) => (
              <MediaCard
                key={other.slug}
                href={`/genre/${other.slug}`}
                title={other.skill}
                subtitle={other.description}
                art={genreArt(other)}
                play={{ context: genreContext(other) }}
              />
            ))}
          </Shelf>
        </div>
      </ReleaseBody>
    </div>
  );
}
