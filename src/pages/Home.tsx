import { useCallback, useRef, type CSSProperties } from "react";
import { Link } from "react-router";
import { MediaCard } from "../components/MediaCard";
import { QuickPicks, type QuickPick } from "../components/QuickPicks";
import { RecruiterHero } from "../components/RecruiterHero";
import { Shelf } from "../components/Shelf";
import { artistArt, releaseArt, songArt } from "../content/artwork";
import { caseStudyById, collections, releaseHref } from "../content/selectors";
import { yearSpan } from "../content/songFacts";
import type { Collection } from "../content/types";
import { portfolio } from "../content/portfolio";
import { useGreeting } from "../lib/useGreeting";
import {
  ARTIST_TOP_TRACK_IDS,
  artistContext,
  releaseContext,
} from "../player/tracks";

const songsById = (ids: readonly string[]) =>
  ids.map((id) => {
    const song = caseStudyById(id);
    if (!song) throw new Error(`Missing Home song: ${id}`);
    return song;
  });

/** One experience, one project, one achievement, for a fast review. */
const recruiterEssentials = songsById(["r1", "p2", "a2"]);
const topSongs = songsById(ARTIST_TOP_TRACK_IDS);

const releaseSubtitle = (release: Collection) => {
  const years = yearSpan(
    release.caseStudyIds.flatMap((id) => caseStudyById(id) ?? []),
  );
  return years ? `${years} · ${release.releaseType}` : release.releaseType;
};

/** The spotlight plays "This Is Darshil Jain"; the rest of Home shows the others. */
const otherReleases = collections.filter(
  (release) => release.id !== "this-is-darshil-jain",
);

const quickPicks: QuickPick[] = [
  {
    id: "artist",
    title: portfolio.candidate.name,
    href: "/artist",
    art: artistArt,
    context: artistContext,
    round: true,
  },
  ...otherReleases.map((release) => ({
    id: release.id,
    title: release.title,
    href: releaseHref(release),
    art: releaseArt(release),
    context: releaseContext(release),
    releaseId: release.id,
  })),
];

const RESTING_WASH = "#2a2a2a";

/**
 * Home: the recruiter briefing first (everything a recruiter needs fits the
 * first screen), then the app's Home: a greeting by the visitor's clock, the
 * quick-pick tiles that tint the page as you hover them, and shelves.
 */
export function Home() {
  const greeting = useGreeting();
  const wash = useRef<HTMLDivElement>(null);
  const tint = useCallback((color: string | null) => {
    wash.current?.style.setProperty("--wash", color ?? RESTING_WASH);
  }, []);

  return (
    <div className="flex flex-col">
      <RecruiterHero />

      <div className="relative -mx-(--content-x) px-(--content-x) pt-6">
        <div
          ref={wash}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-(--wash) opacity-60 transition-[background-color] duration-700 [mask-image:linear-gradient(black,transparent)]"
          style={{ "--wash": RESTING_WASH } as CSSProperties}
        />
        <div className="relative space-y-10">
          <section aria-labelledby="home-greeting">
            <h2 id="home-greeting" className="mb-4 text-headline">
              {greeting ?? "Welcome to Darshify"}
            </h2>
            <QuickPicks picks={quickPicks} onTint={tint} />
          </section>

          <Link
            to="/rewind"
            className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-panel bg-linear-to-br from-[#da1056] via-[#1e3264] to-[#0c6cde] p-5 transition-transform duration-(--dur-hover) motion-safe:hover:scale-[1.01] md:p-7"
          >
            <span>
              <span className="block text-sm font-bold text-white/85">
                Your year in review
              </span>
              <span className="block text-2xl font-black tracking-[-0.03em] md:text-4xl">
                Darshil&apos;s Rewind is here
              </span>
              <span className="mt-1 block text-sm text-white/85">
                Internships, top skills, awards: the story in eight slides.
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-fg px-5 py-2.5 text-sm font-bold text-black">
              Watch now
            </span>
          </Link>

          <div className="-mx-3">
            <Shelf title="Recruiter Essentials">
              {recruiterEssentials.map((song) => (
                <MediaCard
                  key={song.id}
                  href={`/case-studies/${song.slug}`}
                  linkLabel={`Read case study: ${song.title}`}
                  title={song.title}
                  subtitle={song.tagline}
                  art={songArt(song)}
                  kind={song.kind}
                  menu={{ kind: "song", id: song.id }}
                />
              ))}
            </Shelf>
          </div>

          <div className="-mx-3">
            <Shelf title="Darshil's top songs" href="/artist">
              {topSongs.map((song) => (
                <MediaCard
                  key={song.id}
                  href={`/case-studies/${song.slug}`}
                  title={song.title}
                  subtitle={song.organization}
                  art={songArt(song)}
                  play={{ context: artistContext, trackId: song.id }}
                  menu={{ kind: "song", id: song.id }}
                />
              ))}
            </Shelf>
          </div>

          <div className="-mx-3">
            <Shelf title="Releases" href="/library">
              {otherReleases.map((release) => (
                <MediaCard
                  key={release.id}
                  href={releaseHref(release)}
                  title={release.title}
                  subtitle={releaseSubtitle(release)}
                  art={releaseArt(release)}
                  kind="collection"
                  play={{ context: releaseContext(release) }}
                  menu={{ kind: "release", id: release.id }}
                />
              ))}
            </Shelf>
          </div>
        </div>
      </div>
    </div>
  );
}
