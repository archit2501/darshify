export type EvidenceStatus = "verified" | "self-reported" | "redacted";

export interface CandidateProfile {
  name: string;
  headline: string;
  summary: string;
  profileArtwork: {
    artifactId: string;
    proofId: string;
  };
  email: string;
  phone: string;
  linkedInUrl: string;
  resumeUrl: string;
  skills: string[];
}

export interface EvidenceSource {
  id: string;
  title: string;
  kind: "resume" | "certificate" | "work-sample" | "public-link";
  url?: string;
  note: string;
}

export interface ProofPoint {
  id: string;
  label: string;
  value: number;
  unit: string;
  summary: string;
  period: string;
  status: EvidenceStatus;
  sourceIds: string[];
  caseStudyIds: string[];
}

export interface Artifact {
  id: string;
  title: string;
  kind: "document" | "certificate" | "dashboard" | "presentation";
  url?: string;
  alt: string;
  provenance: string;
  sourceIds: string[];
  status: EvidenceStatus;
  image?: {
    src: string;
    width: number;
    height: number;
    variants?: Array<{
      src: string;
      width: number;
    }>;
  };
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  organization: string;
  role: string;
  period: string;
  kind: "experience" | "project" | "leadership" | "achievement" | "education";
  recruiterTakeaway: string;
  situation: string;
  actions: string[];
  result: string;
  featuredProofId: string | null;
  proofIds: string[];
  artifactIds: string[];
  skills: string[];
  relatedIds: string[];
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  themedLabel: string;
  description: string;
  cover: string;
  gradient: string;
  caseStudyIds: string[];
}

export interface CaseStudyEvidence {
  caseStudy: CaseStudy;
  proof?: ProofPoint;
  source: EvidenceSource;
  status: EvidenceStatus;
}

export interface CareerMixChapter {
  id: string;
  title: string;
  summary: string;
  caseStudyIds: string[];
}

export interface Portfolio {
  candidate: CandidateProfile;
  sources: EvidenceSource[];
  proofPoints: ProofPoint[];
  artifacts: Artifact[];
  caseStudies: CaseStudy[];
  collections: Collection[];
  careerMixChapters: CareerMixChapter[];
}
