import { useRef } from "react";
import { ActionBar } from "../components/ActionBar";
import { MediaCard } from "../components/MediaCard";
import { ReleaseBody, ReleaseHeader } from "../components/ReleaseHeader";
import { Shelf } from "../components/Shelf";
import { TrackTable } from "../components/TrackTable";
import { releaseArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import { caseStudyById, releaseHref } from "../content/selectors";
import { yearSpan } from "../content/songFacts";
import type { Collection } from "../content/types";
import { releaseContext, trackById } from "../player/tracks";
import { PlayButton } from "../shell/PlayButton";
import { ReleaseMenu } from "../shell/ReleaseMenu";
import { StickyHeader } from "../shell/StickyHeader";
import { formatListLength } from "../shell/time";

/** "4 songs, 2 min 10 sec": how many, and how long the list plays. */
function countAndLength(release: Collection) {
  const count = release.caseStudyIds.length;
  const totalMs = release.caseStudyIds.reduce(
    (sum, id) => sum + (trackById(id)?.durationMs ?? 0),
    0,
  );
  return `${count} ${count === 1 ? "song" : "songs"}, ${formatListLength(totalMs)}`;
}

/** "2024–2026 · EP", as the artist's discography shows releases. */
function releaseSubtitle(release: Collection) {
  const years = yearSpan(
    release.caseStudyIds.flatMap((id) => caseStudyById(id) ?? []),
  );
  return years ? `${years} · ${release.releaseType}` : release.releaseType;
}

/**
 * A playlist, EP, album or single as the app lays it out: the coloured
 * header, the action bar, the track list, and more releases by the artist.
 * A slim bar with Play and the title takes over once the header scrolls by.
 */
export function ReleaseView({
  release,
  title = release.title,
}: {
  release: Collection;
  /** Liked Songs keeps its own heading. */
  title?: string;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const songs = release.caseStudyIds.map((id) => {
    const song = caseStudyById(id);
    if (!song) throw new Error(`${release.id} lists a missing song: ${id}`);
    return song;
  });
  const context = releaseContext(release);
  const art = releaseArt(release);
  const years = yearSpan(songs);
  const others = portfolio.collections.filter(
    (other) => other.id !== release.id,
  );

  return (
    // A flex column, so the sticky bar's and header's negative margins add
    // up instead of collapsing into one.
    <div className="flex flex-col">
      <StickyHeader
        sentinel={sentinel}
        color={art.color}
        title={title}
        action={<PlayButton context={context} label={title} size={48} />}
      />
      <ReleaseHeader
        type={release.releaseType}
        title={title}
        description={release.description}
        art={art}
        meta={
          years ? [years, countAndLength(release)] : [countAndLength(release)]
        }
      />
      <div ref={sentinel} aria-hidden="true" />
      <ReleaseBody color={art.color}>
        <ActionBar
          context={context}
          label={title}
          saveId={release.id}
          menu={<ReleaseMenu releaseId={release.id} size="lg" />}
        />
        <TrackTable songs={songs} context={context} label={`${title} songs`} />
        <div className="mt-12 -mx-3">
          <Shelf title="More by Darshil Jain" href="/artist">
            {others.map((other) => (
              <MediaCard
                key={other.id}
                href={releaseHref(other)}
                title={other.title}
                subtitle={releaseSubtitle(other)}
                art={releaseArt(other)}
                play={{ context: releaseContext(other) }}
                menu={{ kind: "release", id: other.id }}
              />
            ))}
          </Shelf>
        </div>
      </ReleaseBody>
    </div>
  );
}
