import { portfolio } from "./portfolio";

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

export const searchPortfolio = (query: string) => {
  const needle = normalize(query);
  return needle
    ? searchableCaseStudies
        .filter(({ searchText }) => searchText.includes(needle))
        .map(({ item }) => item)
    : [];
};

export const collections = portfolio.collections;
