import { portfolio } from "./portfolio";
import type { CaseStudy, CaseStudyEvidence } from "./types";

const normalize = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();

const caseStudyIdMap = new Map(
  portfolio.caseStudies.map((item) => [item.id, item]),
);
const caseStudySlugMap = new Map(
  portfolio.caseStudies.map((item) => [item.slug, item]),
);
const proofIdMap = new Map(
  portfolio.proofPoints.map((item) => [item.id, item]),
);
const sourceIdMap = new Map(portfolio.sources.map((item) => [item.id, item]));
const artifactIdMap = new Map(
  portfolio.artifacts.map((item) => [item.id, item]),
);
const collectionIdMap = new Map(
  portfolio.collections.map((item) => [item.id, item]),
);

const caseStudyEvidenceIdMap = new Map<string, CaseStudyEvidence>(
  portfolio.caseStudies.map((caseStudy) => {
    const proof = caseStudy.featuredProofId
      ? proofIdMap.get(caseStudy.featuredProofId)
      : undefined;
    const artifact = artifactIdMap.get(caseStudy.artifactIds[0] ?? "");
    const sourceId = proof?.sourceIds[0] ?? artifact?.sourceIds[0];
    const source = sourceId ? sourceIdMap.get(sourceId) : undefined;
    const status = proof?.status ?? artifact?.status;

    if (!source || !status) {
      throw new Error(
        `Case study ${caseStudy.id} has no canonical evidence source`,
      );
    }

    return [caseStudy.id, { caseStudy, proof, source, status }];
  }),
);

const searchableCaseStudies = portfolio.caseStudies.map((item) => {
  const proofs = item.proofIds.flatMap((id) => {
    const proof = proofIdMap.get(id);
    return proof ? [proof] : [];
  });
  const artifacts = item.artifactIds.flatMap((id) => {
    const artifact = artifactIdMap.get(id);
    return artifact ? [artifact] : [];
  });
  const sources = new Set([
    ...proofs.flatMap((proof) => proof.sourceIds),
    ...artifacts.flatMap((artifact) => artifact.sourceIds),
  ]);
  const sourceEvidence = [...sources].flatMap((id) => {
    const source = sourceIdMap.get(id);
    return source ? [source.title, source.kind, source.note] : [];
  });

  return {
    item,
    searchText: normalize(
      [
        item.title,
        item.organization,
        item.role,
        item.period,
        item.kind,
        item.recruiterTakeaway,
        item.situation,
        ...item.actions,
        item.result,
        ...item.skills,
        ...proofs.flatMap((proof) => [
          proof.label,
          proof.summary,
          proof.period,
        ]),
        ...artifacts.flatMap((artifact) => [
          artifact.title,
          artifact.alt,
          artifact.provenance,
        ]),
        ...sourceEvidence,
      ].join(" "),
    ),
  };
});

export interface SkillSearchResult {
  label: string;
  caseStudyIds: string[];
}

const searchableSkills: Array<SkillSearchResult & { searchText: string }> = [
  ...new Set(portfolio.caseStudies.flatMap((item) => item.skills)),
].map((label) => ({
  label,
  caseStudyIds: portfolio.caseStudies
    .filter((item) => item.skills.includes(label))
    .map((item) => item.id),
  searchText: normalize(label),
}));

export const caseStudyById = (id: string) => caseStudyIdMap.get(id);
export const caseStudyBySlug = (slug: string) => caseStudySlugMap.get(slug);
export const proofById = (id: string) => proofIdMap.get(id);
export const sourceById = (id: string) => sourceIdMap.get(id);
export const artifactById = (id: string) => artifactIdMap.get(id);
export const collectionById = (id: string) => collectionIdMap.get(id);
export const caseStudyEvidenceById = (id: string) =>
  caseStudyEvidenceIdMap.get(id);
export const relatedCaseStudies = (caseStudy: CaseStudy) =>
  caseStudy.relatedIds.flatMap((id) => {
    const related = caseStudyIdMap.get(id);
    return related ? [related] : [];
  });

export const searchPortfolio = (query: string) => {
  const needle = normalize(query);
  return needle
    ? searchableCaseStudies
        .filter(({ searchText }) => searchText.includes(needle))
        .map(({ item }) => item)
    : [];
};

export const searchSkills = (query: string): SkillSearchResult[] => {
  const needle = normalize(query);
  return needle
    ? searchableSkills
        .filter(({ searchText }) => searchText.includes(needle))
        .map(({ label, caseStudyIds }) => ({ label, caseStudyIds }))
    : [];
};

export const collections = portfolio.collections;
