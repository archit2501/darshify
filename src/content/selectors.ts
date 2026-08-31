import { portfolio } from "./portfolio";
import type { CaseStudyEvidence } from "./types";

const normalize = (value: string) =>
  value.normalize("NFKD").toLowerCase().trim();

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
    const proof = proofIdMap.get(caseStudy.proofIds[0] ?? "");
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

const searchableCaseStudies = portfolio.caseStudies.map((item) => ({
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
    ].join(" "),
  ),
}));

export const caseStudyById = (id: string) => caseStudyIdMap.get(id);
export const caseStudyBySlug = (slug: string) => caseStudySlugMap.get(slug);
export const proofById = (id: string) => proofIdMap.get(id);
export const sourceById = (id: string) => sourceIdMap.get(id);
export const artifactById = (id: string) => artifactIdMap.get(id);
export const collectionById = (id: string) => collectionIdMap.get(id);
export const caseStudyEvidenceById = (id: string) =>
  caseStudyEvidenceIdMap.get(id);

export const searchPortfolio = (query: string) => {
  const needle = normalize(query);
  return needle
    ? searchableCaseStudies
        .filter(({ searchText }) => searchText.includes(needle))
        .map(({ item }) => item)
    : [];
};

export const collections = portfolio.collections;
