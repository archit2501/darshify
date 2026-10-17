import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { trackOutcome } from "../analytics/outcomes";
import { ActionBar } from "../components/ActionBar";
import { ContactActions } from "../components/ContactActions";
import { EvidencePanel } from "../components/EvidencePanel";
import { MediaCard } from "../components/MediaCard";
import { ReleaseBody, ReleaseHeader } from "../components/ReleaseHeader";
import { Shelf } from "../components/Shelf";
import { SongLyrics } from "../components/SongLyrics";
import { releaseArt, songArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import {
  artifactById,
  proofById,
  relatedCaseStudies,
  releaseHref,
  sourceById,
} from "../content/selectors";
import { lengthLabel } from "../content/songFacts";
import type {
  Artifact,
  CaseStudy,
  EvidenceSource,
  ProofPoint,
} from "../content/types";
import { formatProofValue } from "../content/waveform";
import { releaseContext, songContext } from "../player/tracks";
import { ArtistCard, CreditsCard } from "../shell/NowPlayingCards";
import { PlayButton } from "../shell/PlayButton";
import { SongMenu } from "../shell/SongMenu";
import { StickyHeader } from "../shell/StickyHeader";

const resolveAll = <T,>(
  ids: string[],
  selector: (id: string) => T | undefined,
  owner: string,
): T[] =>
  ids.map((id) => {
    const item = selector(id);
    if (!item) throw new Error(`${owner} references missing evidence ${id}`);
    return item;
  });

const sourcesFor = (sourceIds: string[], owner: string): EvidenceSource[] =>
  resolveAll(sourceIds, sourceById, owner);

/**
 * A song page: the case study laid out as the app shows a song. The header
 * carries what a recruiter needs first (role, the takeaway, the strongest
 * sourced result and where it comes from); below come the lyrics, the full
 * story with its evidence, credits, the artist, and more like it.
 */
export function CaseStudyPage({ caseStudy }: { caseStudy: CaseStudy }) {
  useEffect(() => {
    trackOutcome("case_study_open", {
      caseStudyId: caseStudy.id,
      placement: "case-study",
    });
  }, [caseStudy.id]);
  const sentinel = useRef<HTMLDivElement>(null);

  const proofs = resolveAll(caseStudy.proofIds, proofById, caseStudy.id);
  const artifacts = resolveAll(
    caseStudy.artifactIds,
    artifactById,
    caseStudy.id,
  );
  const primaryArtifact = artifacts[0];
  const primaryProof = caseStudy.featuredProofId
    ? proofById(caseStudy.featuredProofId)
    : undefined;
  const primarySourceId =
    primaryProof?.sourceIds[0] ?? primaryArtifact?.sourceIds[0];
  const primarySource = primarySourceId
    ? sourceById(primarySourceId)
    : undefined;
  const primaryStatus = primaryProof?.status ?? primaryArtifact?.status;
  if (!primarySource || !primaryStatus) {
    throw new Error(`Case study ${caseStudy.id} has no displayable evidence`);
  }

  const art = songArt(caseStudy);
  const context = songContext(caseStudy);
  const releaseId = context.id.replace(/^release:/, "");
  const related = relatedCaseStudies(caseStudy);
  const otherReleases = portfolio.collections.filter(
    (item) => item.id !== releaseId,
  );
  const length = lengthLabel(caseStudy);

  return (
    <article className="flex flex-col">
      <StickyHeader
        sentinel={sentinel}
        color={art.color}
        title={caseStudy.title}
        action={
          <PlayButton
            context={context}
            trackId={caseStudy.id}
            label={caseStudy.title}
            size={48}
          />
        }
      />
      <ReleaseHeader
        type="Song"
        title={caseStudy.title}
        description={`${caseStudy.role} · ${caseStudy.organization}`}
        art={art}
        compact
        meta={[
          <Link key="release" to={context.href} className="hover:underline">
            {context.title}
          </Link>,
          ...(caseStudy.period ? [caseStudy.period] : []),
          ...(length ? [length] : []),
        ]}
      >
        <p className="max-w-3xl font-bold text-fg">{caseStudy.tagline}</p>
        <div className="mt-1 max-w-3xl rounded-panel bg-black/25 p-3 md:p-4">
          {primaryProof ? (
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-black text-green">
                {formatProofValue(primaryProof)}
              </span>
              <span className="font-bold">{primaryProof.label}</span>
            </p>
          ) : null}
          <p className="mt-1 text-sm text-white/85">{caseStudy.result}</p>
          <p className="mt-2 text-xs text-white/70">
            Source: {primarySource.title}
            <span aria-hidden="true"> · </span>
            <span className="font-bold text-green">{primaryStatus}</span>
          </p>
        </div>
      </ReleaseHeader>
      <div ref={sentinel} aria-hidden="true" />

      <ReleaseBody color={art.color}>
        <ActionBar
          context={context}
          trackId={caseStudy.id}
          label={caseStudy.title}
          saveId={caseStudy.id}
          menu={<SongMenu songId={caseStudy.id} context={context} size="lg" />}
        />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-10">
            <SongLyrics song={caseStudy} context={context} />

            <section aria-labelledby="situation-heading">
              <h2
                id="situation-heading"
                className="text-section-title font-bold"
              >
                Situation
              </h2>
              <p className="mt-3 max-w-[70ch] leading-relaxed text-white/80">
                {caseStudy.situation}
              </p>
            </section>

            <section aria-labelledby="action-heading">
              <h2 id="action-heading" className="text-section-title font-bold">
                Action
              </h2>
              <ol className="mt-4 space-y-1">
                {caseStudy.actions.map((action, index) => (
                  <li
                    key={action}
                    className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 rounded-row px-2 py-2 hover:bg-tint"
                  >
                    <span className="text-right text-subdued">{index + 1}</span>
                    <span className="leading-relaxed text-white/85">
                      {action}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="result-heading">
              <h2 id="result-heading" className="text-section-title font-bold">
                Result
              </h2>
              <p className="mt-3 max-w-[70ch] rounded-panel bg-surface-hi p-4 text-lg leading-relaxed font-bold">
                {caseStudy.result}
              </p>
              <p className="mt-2 text-sm text-subdued">
                {caseStudy.period ? `${caseStudy.period} · ` : ""}
                Verification: {primaryStatus}
              </p>
            </section>

            <EvidencePanel
              proofs={proofs}
              artifacts={artifacts}
              sourceForProof={(proof: ProofPoint) =>
                sourcesFor(proof.sourceIds, proof.id)
              }
              sourceForArtifact={(artifact: Artifact) =>
                sourcesFor(artifact.sourceIds, artifact.id)
              }
            />

            {caseStudy.skills.length > 0 ? (
              <section aria-labelledby="skills-heading">
                <h2
                  id="skills-heading"
                  className="text-section-title font-bold"
                >
                  Skills in this song
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {caseStudy.skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full bg-tint px-3 py-1.5 text-sm font-semibold"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside aria-label="About this song" className="space-y-4">
            <CreditsCard songId={caseStudy.id} />
            <ArtistCard />
          </aside>
        </div>

        {related.length > 0 ? (
          <div className="-mx-3 mt-12">
            <Shelf title="More like this">
              {related.map((item) => (
                <MediaCard
                  key={item.id}
                  href={`/case-studies/${item.slug}`}
                  title={item.title}
                  subtitle={item.tagline}
                  art={songArt(item)}
                  play={{ context: songContext(item), trackId: item.id }}
                  menu={{ kind: "song", id: item.id }}
                />
              ))}
            </Shelf>
          </div>
        ) : null}

        <div className="-mx-3 mt-8">
          <Shelf title="More by Darshil Jain" href="/artist">
            {otherReleases.map((item) => (
              <MediaCard
                key={item.id}
                href={releaseHref(item)}
                title={item.title}
                subtitle={item.releaseType}
                art={releaseArt(item)}
                play={{ context: releaseContext(item) }}
                menu={{ kind: "release", id: item.id }}
              />
            ))}
          </Shelf>
        </div>

        <section
          aria-labelledby="conversation-heading"
          className="mt-12 rounded-panel bg-surface-hi p-5 md:p-6"
        >
          <h2
            id="conversation-heading"
            className="text-section-title font-bold"
          >
            Start a conversation
          </h2>
          <p className="mt-2 mb-5 max-w-[65ch] text-subdued">
            Download Darshil&apos;s résumé, or get in touch about this work.
          </p>
          <ContactActions candidate={portfolio.candidate} placement="hero" />
        </section>
      </ReleaseBody>
    </article>
  );
}
