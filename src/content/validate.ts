import { MAX_RELEASE_LUMINANCE, isHexColor, relativeLuminance } from "./color";
import type { Portfolio } from "./types";

const evidenceStatuses = new Set(["verified", "self-reported", "redacted"]);
const releaseTypes = new Set(["Playlist", "EP", "Album", "Single"]);
const calendarDate = /^\d{4}(-(0[1-9]|1[0-2]))?$/;
const MAX_LYRIC_LENGTH = 80;

/**
 * The résumé is the stated source for everything on the site, so copy never
 * hedges each sentence with it, and a missing date stays blank instead of
 * being printed as one.
 */
const hedgingCopy =
  /r[ée]sum[ée] reports|according to the r[ée]sum[ée]|r[ée]sum[ée]-listed|listed (as .* )?in the r[ée]sum[ée]|date not listed|self-reported through|not been independently verified/i;

const colorErrors = (owner: string, color: string): string[] => {
  if (!isHexColor(color)) return [`${owner} has an invalid colour ${color}`];
  return relativeLuminance(color) > MAX_RELEASE_LUMINANCE
    ? [`${owner} colour ${color} is too light for white text`]
    : [];
};

const duplicateValues = (values: string[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates];
};

export const validatePortfolio = (value: Portfolio): string[] => {
  const errors: string[] = [];
  const sourceById = new Map(
    value.sources.map((source) => [source.id, source]),
  );
  const sourceIds = new Set(value.sources.map((source) => source.id));
  const proofById = new Map(
    value.proofPoints.map((proof) => [proof.id, proof]),
  );
  const artifactById = new Map(
    value.artifacts.map((artifact) => [artifact.id, artifact]),
  );
  const artifactIds = new Set(artifactById.keys());
  const caseStudyById = new Map(
    value.caseStudies.map((caseStudy) => [caseStudy.id, caseStudy]),
  );
  const caseStudyIds = new Set(
    value.caseStudies.map((caseStudy) => caseStudy.id),
  );

  const entityGroups = [
    ["source", value.sources.map((item) => item.id)],
    ["proof point", value.proofPoints.map((item) => item.id)],
    ["artifact", value.artifacts.map((item) => item.id)],
    ["case study", value.caseStudies.map((item) => item.id)],
    ["collection", value.collections.map((item) => item.id)],
    ["genre", value.genres.map((item) => item.slug)],
    ["career mix chapter", value.careerMixChapters.map((item) => item.id)],
  ] as const;

  for (const [entityName, ids] of entityGroups) {
    for (const id of duplicateValues(ids)) {
      errors.push(`Duplicate ${entityName} id: ${id}`);
    }
  }

  for (const slug of duplicateValues(
    value.caseStudies.map((item) => item.slug),
  )) {
    errors.push(`Duplicate case study slug: ${slug}`);
  }
  for (const slug of duplicateValues(
    value.collections.map((item) => item.slug),
  )) {
    errors.push(`Duplicate collection slug: ${slug}`);
  }

  const profileArtwork = value.candidate.profileArtwork;
  const profileArtworkArtifact = artifactById.get(profileArtwork.artifactId);
  const profileArtworkProof = proofById.get(profileArtwork.proofId);

  if (!profileArtworkArtifact) {
    errors.push(
      `Candidate profile artwork references unknown artifact ${profileArtwork.artifactId}`,
    );
  } else if (!profileArtworkArtifact.image) {
    errors.push(
      `Candidate profile artwork artifact ${profileArtwork.artifactId} must be image-backed`,
    );
  }
  if (!profileArtworkProof) {
    errors.push(
      `Candidate profile artwork references unknown proof ${profileArtwork.proofId}`,
    );
  }
  if (
    profileArtworkArtifact &&
    profileArtworkProof &&
    !profileArtworkArtifact.sourceIds.some((sourceId) =>
      profileArtworkProof.sourceIds.includes(sourceId),
    )
  ) {
    errors.push(
      `Candidate profile artwork ${profileArtworkArtifact.id} and proof ${profileArtworkProof.id} must share an evidence source`,
    );
  }

  for (const proof of value.proofPoints) {
    if (!Number.isFinite(proof.value)) {
      errors.push(`Proof point ${proof.id} has an invalid quantitative value`);
    }
    if (!proof.display.trim() || !proof.label.trim()) {
      errors.push(`Proof point ${proof.id} is missing its display value`);
    }
    if (proof.period !== undefined && !proof.period.trim()) {
      errors.push(`Proof point ${proof.id} has an empty period`);
    }
    if (!proof.status) {
      errors.push(`Proof point ${proof.id} is missing an evidence status`);
    } else if (!evidenceStatuses.has(proof.status)) {
      errors.push(
        `Proof point ${proof.id} has unsupported evidence status ${proof.status}`,
      );
    }
    if (proof.sourceIds.length === 0) {
      errors.push(`Proof point ${proof.id} is missing a source`);
    }
    const resolvedSources = proof.sourceIds
      .map((sourceId) => sourceById.get(sourceId))
      .filter((source) => source !== undefined);
    if (
      resolvedSources.length > 0 &&
      resolvedSources.length === proof.sourceIds.length &&
      resolvedSources.every((source) => source.kind === "resume") &&
      proof.status !== "self-reported"
    ) {
      errors.push(
        `Proof point ${proof.id} uses only resume sources and must be self-reported`,
      );
    }
    for (const sourceId of proof.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        errors.push(
          `Proof point ${proof.id} references unknown source ${sourceId}`,
        );
      }
    }
    if (proof.caseStudyIds.length === 0) {
      errors.push(`Proof point ${proof.id} is missing a case study link`);
    }
    for (const caseStudyId of proof.caseStudyIds) {
      const caseStudy = caseStudyById.get(caseStudyId);
      if (!caseStudy) {
        errors.push(
          `Proof point ${proof.id} references unknown case study ${caseStudyId}`,
        );
      } else if (!caseStudy.proofIds.includes(proof.id)) {
        errors.push(
          `Proof point ${proof.id} is not linked back from case study ${caseStudyId}`,
        );
      }
    }
  }

  for (const artifact of value.artifacts) {
    if (!artifact.alt.trim()) {
      errors.push(`Artifact ${artifact.id} is missing alt text`);
    }
    if (!artifact.provenance.trim() || artifact.sourceIds.length === 0) {
      errors.push(`Artifact ${artifact.id} is missing provenance`);
    }
    for (const sourceId of artifact.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        errors.push(
          `Artifact ${artifact.id} references unknown source ${sourceId}`,
        );
      }
    }
  }

  for (const caseStudy of value.caseStudies) {
    const featuredProof = caseStudy.featuredProofId
      ? proofById.get(caseStudy.featuredProofId)
      : undefined;
    if (caseStudy.proofIds.length > 0 && !caseStudy.featuredProofId) {
      errors.push(`Case study ${caseStudy.id} is missing a featured proof`);
    } else if (caseStudy.featuredProofId && !featuredProof) {
      errors.push(
        `Case study ${caseStudy.id} references unknown featured proof ${caseStudy.featuredProofId}`,
      );
    } else if (
      caseStudy.featuredProofId &&
      !caseStudy.proofIds.includes(caseStudy.featuredProofId)
    ) {
      errors.push(
        `Case study ${caseStudy.id} featured proof ${caseStudy.featuredProofId} is not a member of its proof IDs`,
      );
    } else if (featuredProof) {
      const artifactSourceIds = new Set(
        caseStudy.artifactIds.flatMap(
          (artifactId) => artifactById.get(artifactId)?.sourceIds ?? [],
        ),
      );
      if (
        !featuredProof.sourceIds.some((sourceId) =>
          artifactSourceIds.has(sourceId),
        )
      ) {
        errors.push(
          `Case study ${caseStudy.id} featured proof ${featuredProof.id} does not share provenance with its artifacts`,
        );
      }
    }

    for (const proofId of caseStudy.proofIds) {
      const proof = proofById.get(proofId);
      if (!proof) {
        errors.push(
          `Case study ${caseStudy.id} references unknown proof point ${proofId}`,
        );
      } else if (!proof.caseStudyIds.includes(caseStudy.id)) {
        errors.push(
          `Case study ${caseStudy.id} is not linked back from proof point ${proofId}`,
        );
      }
    }
    for (const artifactId of caseStudy.artifactIds) {
      if (!artifactIds.has(artifactId)) {
        errors.push(
          `Case study ${caseStudy.id} references unknown artifact ${artifactId}`,
        );
      }
    }
    if (!caseStudy.tagline.trim()) {
      errors.push(`Case study ${caseStudy.id} is missing a tagline`);
    }
    if (caseStudy.lyrics.length < 2 || caseStudy.lyrics.length > 6) {
      errors.push(`Case study ${caseStudy.id} needs 2-6 lyric lines`);
    }
    for (const line of caseStudy.lyrics) {
      if (!line.trim() || line.length > MAX_LYRIC_LENGTH) {
        errors.push(
          `Case study ${caseStudy.id} has a lyric line that is empty or longer than ${MAX_LYRIC_LENGTH} characters`,
        );
      }
    }
    errors.push(...colorErrors(`Case study ${caseStudy.id}`, caseStudy.color));
    for (const [label, date] of [
      ["start", caseStudy.start],
      ["end", caseStudy.end],
    ] as const) {
      if (date !== undefined && !calendarDate.test(date)) {
        errors.push(`Case study ${caseStudy.id} has an invalid ${label} date`);
      }
    }
    if (caseStudy.start && caseStudy.end && caseStudy.end < caseStudy.start) {
      errors.push(`Case study ${caseStudy.id} ends before it starts`);
    }
    if (
      [
        caseStudy.title,
        caseStudy.tagline,
        caseStudy.situation,
        caseStudy.result,
        caseStudy.period ?? "",
        ...caseStudy.actions,
        ...caseStudy.lyrics,
      ].some((text) => hedgingCopy.test(text))
    ) {
      errors.push(`Case study ${caseStudy.id} uses hedging copy`);
    }
    for (const skill of caseStudy.skills) {
      if (!value.candidate.skills.includes(skill)) {
        errors.push(`Case study ${caseStudy.id} uses unknown skill ${skill}`);
      }
    }
    if (caseStudy.relatedIds.length === 0) {
      errors.push(`Case study ${caseStudy.id} is missing a related case study`);
    }
    for (const relatedId of caseStudy.relatedIds) {
      if (relatedId === caseStudy.id) {
        errors.push(`Case study ${caseStudy.id} cannot relate to itself`);
      }
      if (!caseStudyIds.has(relatedId)) {
        errors.push(
          `Case study ${caseStudy.id} references unknown related case study ${relatedId}`,
        );
      }
    }
  }

  const validateCaseStudyRefs = (
    ownerType: "Collection" | "Career mix chapter",
    ownerId: string,
    ids: string[],
  ) => {
    for (const caseStudyId of ids) {
      if (!caseStudyIds.has(caseStudyId)) {
        errors.push(
          `${ownerType} ${ownerId} references unknown case study ${caseStudyId}`,
        );
      }
    }
  };

  for (const collection of value.collections) {
    if (!releaseTypes.has(collection.releaseType)) {
      errors.push(
        `Collection ${collection.id} has unsupported release type ${collection.releaseType}`,
      );
    }
    if (hedgingCopy.test(collection.description)) {
      errors.push(`Collection ${collection.id} uses hedging copy`);
    }
    errors.push(
      ...colorErrors(`Collection ${collection.id}`, collection.color),
    );
    validateCaseStudyRefs("Collection", collection.id, collection.caseStudyIds);
  }
  for (const chapter of value.careerMixChapters) {
    validateCaseStudyRefs(
      "Career mix chapter",
      chapter.id,
      chapter.caseStudyIds,
    );
  }

  const genreSkills = new Set(value.genres.map((genre) => genre.skill));
  for (const genre of value.genres) {
    if (!value.candidate.skills.includes(genre.skill)) {
      errors.push(`Genre ${genre.slug} is not one of the candidate's skills`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(genre.slug)) {
      errors.push(`Genre ${genre.slug} has an invalid slug`);
    }
    errors.push(...colorErrors(`Genre ${genre.slug}`, genre.color));
  }
  for (const skill of value.candidate.skills) {
    if (!genreSkills.has(skill)) {
      errors.push(`Skill ${skill} has no genre`);
    }
  }

  const { candidate } = value;
  if (candidate.bio.length === 0 || candidate.faq.length === 0) {
    errors.push("Candidate needs a bio and answer-first questions");
  }
  if (
    [
      candidate.headline,
      candidate.summary,
      ...candidate.bio,
      ...candidate.faq.flatMap(({ question, answer }) => [question, answer]),
    ].some((text) => hedgingCopy.test(text))
  ) {
    errors.push("Candidate profile uses hedging copy");
  }

  return errors;
};
