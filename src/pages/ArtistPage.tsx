import { useRef, type CSSProperties } from "react";
import { Link } from "react-router";
import { ContactActions } from "../components/ContactActions";
import { MediaCard } from "../components/MediaCard";
import { Shelf } from "../components/Shelf";
import { TrackTable } from "../components/TrackTable";
import { artistArt, releaseArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import {
  caseStudyById,
  caseStudyEvidenceById,
  proofById,
  releaseHref,
} from "../content/selectors";
import { yearSpan } from "../content/songFacts";
import type { Collection } from "../content/types";
import { formatProofValue } from "../content/waveform";
import { ShuffleIcon } from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import {
  ARTIST_TOP_TRACK_IDS,
  artistContext,
  releaseContext,
} from "../player/tracks";
import { Cover } from "../shell/Cover";
import { IconButton } from "../shell/IconButton";
import { PlayButton } from "../shell/PlayButton";
import { StickyHeader } from "../shell/StickyHeader";

const { candidate } = portfolio;

const popular = ARTIST_TOP_TRACK_IDS.map((id) => {
  const song = caseStudyById(id);
  if (!song) throw new Error(`Missing popular song: ${id}`);
  return song;
});

const featured = (() => {
  const evidence = caseStudyEvidenceById("r1");
  if (!evidence?.proof) throw new Error("Missing featured profile proof: r1");
  return { ...evidence, proof: evidence.proof };
})();

/** Real résumé numbers where the app would show listeners and followers. */
const stats = ["figmenta-resumes", "igniters-members", "converge-participants"]
  .map((id) => proofById(id))
  .filter((proof) => proof !== undefined);

const releaseSubtitle = (release: Collection) => {
  const years = yearSpan(
    release.caseStudyIds.flatMap((id) => caseStudyById(id) ?? []),
  );
  return years ? `${years} · ${release.releaseType}` : release.releaseType;
};

const color = candidate.portrait?.dominantColor ?? artistArt.color;

/**
 * Darshil's artist page, as the app lays one out: the artist header (with
 * the headline where the app counts listeners), Play and the ways to get in
 * touch, the strongest sourced proof, the popular songs, the discography,
 * About with real numbers, answers to common questions, and contact.
 */
export function ArtistPage() {
  const sentinel = useRef<HTMLDivElement>(null);
  const shuffle = usePlayer((state) => state.shuffle);
  const { toggleShuffle } = usePlayerActions();

  return (
    <div className="flex flex-col">
      <StickyHeader
        sentinel={sentinel}
        color={color}
        title={candidate.name}
        action={
          <PlayButton
            context={artistContext}
            label={candidate.name}
            size={48}
          />
        }
      />

      <section aria-label="Candidate proposition">
        <header
          className="@container relative -mx-(--content-x) -mt-(--page-top) flex flex-col items-center gap-5 bg-(--artist) bg-linear-to-b from-transparent to-black/55 px-(--content-x) pt-[calc(var(--page-top)+1rem)] pb-6 md:flex-row md:items-end md:gap-6 md:pt-16"
          style={{ "--artist": color } as CSSProperties}
        >
          <Cover
            art={artistArt}
            portrait={candidate.portrait}
            round
            size="fill"
            priority
            className="w-[min(36vw,8.5rem)] shadow-art md:w-[clamp(9rem,20cqi,14.5rem)]"
          />
          <div className="flex w-full min-w-0 flex-col gap-1 md:gap-2">
            <p className="text-sm font-semibold max-md:hidden">Artist</p>
            <h1 className="text-display text-balance">{candidate.name}</h1>
            <p className="text-white/85 md:text-lg">{candidate.headline}</p>
          </div>
        </header>
        <div ref={sentinel} aria-hidden="true" />

        <div
          className="-mx-(--content-x) px-(--content-x) pb-2"
          style={{
            backgroundColor: color,
            backgroundImage:
              "linear-gradient(rgb(0 0 0 / 0.55), var(--color-surface) 100%)",
          }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-6">
            <PlayButton
              context={artistContext}
              label={candidate.name}
              size={56}
            />
            <IconButton
              label={shuffle ? "Disable shuffle" : "Enable shuffle"}
              pressed={shuffle}
              onClick={toggleShuffle}
              size="lg"
            >
              <ShuffleIcon size={24} />
            </IconButton>
            <ContactActions candidate={candidate} placement="hero" />
          </div>

          <article
            aria-label={`Featured proof: ${featured.proof.label}`}
            className="max-w-2xl rounded-panel bg-black/25 p-4"
          >
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-black text-green">
                {formatProofValue(featured.proof)}
              </span>
              <span className="font-bold">{featured.proof.label}</span>
            </p>
            <p className="mt-1 text-sm text-white/85">
              {featured.proof.summary}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
              {featured.source.url ? (
                <a
                  href={featured.source.url}
                  className="underline decoration-white/30 underline-offset-4 hover:decoration-fg"
                >
                  {featured.source.title}
                </a>
              ) : (
                <span>{featured.source.title}</span>
              )}
              <span className="font-bold text-green">{featured.status}</span>
              <Link
                to={`/case-studies/${featured.caseStudy.slug}`}
                className="font-bold text-fg underline decoration-white/30 underline-offset-4 hover:decoration-fg"
              >
                View sourced case study
              </Link>
            </p>
          </article>
        </div>
      </section>

      <div>
        <section aria-label="Popular" className="mt-10">
          <h2 className="mb-3 text-section-title font-bold">Popular</h2>
          <TrackTable
            songs={popular}
            context={artistContext}
            label="Popular songs"
          />
        </section>

        {/* The shelf is the "Discography" region. */}
        <div className="-mx-3 mt-10">
          <Shelf title="Discography" href="/library">
            {portfolio.collections.map((release) => (
              <MediaCard
                key={release.id}
                href={releaseHref(release)}
                title={release.title}
                subtitle={releaseSubtitle(release)}
                art={releaseArt(release)}
                play={{ context: releaseContext(release) }}
                menu={{ kind: "release", id: release.id }}
              />
            ))}
          </Shelf>
        </div>

        <section aria-label="About Darshil Jain" className="mt-10">
          <h2 className="mb-4 text-section-title font-bold">About</h2>
          <div className="overflow-hidden rounded-panel bg-surface-hi">
            <div
              className="relative flex min-h-56 items-end p-5 md:p-8"
              style={{
                backgroundImage: `linear-gradient(transparent, rgb(0 0 0 / 0.7)), linear-gradient(135deg, ${color}, var(--color-surface-hi))`,
              }}
            >
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {stats.map((proof) => (
                  <li key={proof.id}>
                    <span className="block text-3xl font-black">
                      {formatProofValue(proof)}
                    </span>
                    <span className="text-sm text-white/80">{proof.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 p-5 md:p-8">
              {candidate.bio.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="max-w-[70ch] leading-relaxed text-white/85"
                >
                  {paragraph}
                </p>
              ))}
              <h3 className="pt-2 font-bold">Skills</h3>
              <ul className="flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full bg-tint px-3 py-1.5 text-sm font-semibold"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-subdued">
                Every figure on this page comes from{" "}
                <a
                  href={candidate.resumeUrl}
                  className="underline underline-offset-4 hover:text-fg"
                >
                  Darshil Jain&apos;s résumé
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <section aria-label="Frequently asked questions" className="mt-10">
          <h2 className="mb-4 text-section-title font-bold">
            Questions people ask
          </h2>
          <dl className="grid gap-3 md:grid-cols-2">
            {candidate.faq.map((item) => (
              <div
                key={item.question}
                className="rounded-panel bg-surface-hi p-5"
              >
                <dt className="font-bold">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-white/80">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-label="Availability"
          className="mt-10 rounded-panel bg-surface-hi p-5 md:p-6"
        >
          <h2 className="text-section-title font-bold">On tour</h2>
          <p className="mt-2 max-w-[65ch] text-subdued">
            No dates listed. Availability isn&apos;t stated in the résumé, so
            ask Darshil directly about roles, timelines and location.
          </p>
        </section>

        <section
          aria-label="Start a conversation"
          className="mt-6 mb-4 rounded-panel bg-linear-to-br from-green/25 to-surface-hi p-5 md:p-8"
        >
          <h2 className="text-section-title font-bold">Start a conversation</h2>
          <p className="mt-2 mb-5 max-w-[65ch] text-white/80">
            Review the résumé, email Darshil, or continue on LinkedIn.
          </p>
          <ContactActions candidate={candidate} placement="hero" />
        </section>
      </div>
    </div>
  );
}
