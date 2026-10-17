export type EvidenceStatus = "verified" | "self-reported" | "redacted";

/** How a collection presents itself in the streaming-app metaphor. */
export type ReleaseType = "Playlist" | "EP" | "Album" | "Single";

export type SongKind =
  | "experience"
  | "project"
  | "leadership"
  | "achievement"
  | "education"
  | "credential";

/** A year ("2024") or ISO year-month ("2026-01"). */
export type CalendarDate = `${number}` | `${number}-${number}`;

export interface Place {
  locality: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
}

export interface Institution {
  name: string;
  shortName: string;
  parentName: string;
  parentShortName: string;
  place: Place;
  url?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface CandidateProfile {
  name: string;
  givenName: string;
  familyName: string;
  alternateNames: string[];
  /** One line, used under the name and in metadata. */
  headline: string;
  /** Two sentences, used where space is short. */
  summary: string;
  /** Answer-first paragraphs for the About card and AI answer engines. */
  bio: string[];
  education: {
    degree: string;
    field: string;
    institution: Institution;
    start: number;
    end: number;
  };
  profileArtwork: {
    artifactId: string;
    proofId: string;
  };
  email: string;
  phone: string;
  linkedInUrl: string;
  resumeUrl: string;
  profiles: ProfileLink[];
  skills: string[];
  faq: FaqItem[];
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
  /** Lower-case noun phrase that follows the value: "résumés screened". */
  label: string;
  /** Exact display string: "500+", "Top 10%", "4th", "₹50,000+". */
  display: string;
  /** Numeric magnitude used for ordering and charts. */
  value: number;
  summary: string;
  period?: string;
  status: EvidenceStatus;
  sourceIds: string[];
  caseStudyIds: string[];
}

export interface Artifact {
  id: string;
  title: string;
  kind: "document" | "certificate" | "dashboard" | "presentation" | "letter";
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
  /** Display period as written in the résumé; omitted when it lists none. */
  period?: string;
  start?: CalendarDate;
  end?: CalendarDate;
  kind: SongKind;
  /** One-line description shown under titles and in metadata. */
  tagline: string;
  situation: string;
  actions: string[];
  result: string;
  /** 2-6 short first-person lines, sung in order while the song plays. */
  lyrics: string[];
  /** Per-song accent; white text must stay readable (luminance <= 0.18). */
  color: string;
  team?: "Individual project" | "Team project";
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
  releaseType: ReleaseType;
  description: string;
  cover: string;
  gradient: string;
  color: string;
  caseStudyIds: string[];
}

export interface Genre {
  /** Exactly one of the candidate's skills. */
  skill: string;
  slug: string;
  color: string;
  description: string;
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
  genres: Genre[];
  careerMixChapters: CareerMixChapter[];
}
