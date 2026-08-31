import { track } from "@vercel/analytics";
import type { BeforeSendEvent } from "@vercel/analytics/react";
import { portfolio } from "../content/portfolio";
import {
  CANONICAL_SITE_ORIGIN,
  canonicalPathForPathname,
  canonicalRouteInventory,
  type RouteId,
} from "../seo/meta";

export type OutcomeEvent =
  | "cv_download"
  | "email_open"
  | "linkedin_open"
  | "case_study_open"
  | "evidence_open"
  | "career_mix_complete";

export type OutcomePlacement =
  | "hero"
  | "rail"
  | "topbar"
  | "case-study"
  | "proof-track"
  | "evidence-panel"
  | "proof-waveform"
  | "career-mix";

export interface OutcomeProperties {
  routeId?: RouteId;
  caseStudyId?: string;
  evidenceId?: string;
  placement?: OutcomePlacement;
}

type OutcomeTransport = (
  name: OutcomeEvent,
  properties: Record<string, string>,
) => void;

const approvedEvents = new Set<OutcomeEvent>([
  "cv_download",
  "email_open",
  "linkedin_open",
  "case_study_open",
  "evidence_open",
  "career_mix_complete",
]);
const approvedKeys = new Set<keyof OutcomeProperties>([
  "routeId",
  "caseStudyId",
  "evidenceId",
  "placement",
]);
const approvedRouteIds = new Set(canonicalRouteInventory.map(({ id }) => id));
const approvedCaseStudyIds = new Set(portfolio.caseStudies.map(({ id }) => id));
const approvedEvidenceIds = new Set([
  ...portfolio.proofPoints.map(({ id }) => id),
  ...portfolio.artifacts.map(({ id }) => id),
  ...portfolio.sources.map(({ id }) => id),
]);
const approvedPlacements = new Set<OutcomePlacement>([
  "hero",
  "rail",
  "topbar",
  "case-study",
  "proof-track",
  "evidence-panel",
  "proof-waveform",
  "career-mix",
]);

const validateProperties = (
  properties: OutcomeProperties,
): Record<string, string> => {
  const record = properties as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!approvedKeys.has(key as keyof OutcomeProperties)) {
      throw new Error(`Analytics property ${key} is not approved`);
    }
  }

  if (properties.routeId && !approvedRouteIds.has(properties.routeId)) {
    throw new Error("Value is not an approved analytics route ID");
  }
  if (
    properties.caseStudyId &&
    !approvedCaseStudyIds.has(properties.caseStudyId)
  ) {
    throw new Error("Value is not an approved analytics case-study ID");
  }
  if (
    properties.evidenceId &&
    !approvedEvidenceIds.has(properties.evidenceId)
  ) {
    throw new Error("Value is not an approved analytics evidence ID");
  }
  if (properties.placement && !approvedPlacements.has(properties.placement)) {
    throw new Error("Value is not an approved analytics placement");
  }

  return Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
};

export function createOutcomeTracker(
  transport: OutcomeTransport,
  enabled: boolean,
) {
  return (name: OutcomeEvent, properties: OutcomeProperties): boolean => {
    if (!approvedEvents.has(name)) {
      throw new Error(
        `Analytics event ${name} is not an approved analytics event`,
      );
    }
    const payload = validateProperties(properties);
    if (!enabled) return false;
    transport(name, payload);
    return true;
  };
}

const sendToVercel: OutcomeTransport = (name, properties) =>
  track(name, properties);

const canonicalHostname = new URL(CANONICAL_SITE_ORIGIN).hostname;

const encodedDangerousPathOctet =
  /%(?:25)*(?:2e|2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i;
const literalDotSegment = /(?:^|\/)\.{1,2}(?:\/|$)/;
const containsRawControlCharacter = (value: string) =>
  Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });

const validateRawAnalyticsUrl = (
  rawUrl: string,
): { authority: string; pathname: string } | null => {
  if (containsRawControlCharacter(rawUrl) || rawUrl.includes("\\")) return null;

  const match = /^https:\/\/([^/?#]+)(\/[^?#]*)?([?#][\s\S]*)?$/.exec(rawUrl);
  if (!match?.[2]) return null;

  const authority = match[1];
  const labels = authority.split(".");
  if (
    labels.some(
      (label) =>
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label) || label.length > 63,
    )
  ) {
    return null;
  }

  const pathname = match[2];
  if (
    encodedDangerousPathOctet.test(pathname) ||
    literalDotSegment.test(pathname)
  ) {
    return null;
  }

  return { authority, pathname };
};

export function shouldEnableAnalytics(hostname: string): boolean {
  return hostname === canonicalHostname || hostname.endsWith(".vercel.app");
}

export const trackOutcome = createOutcomeTracker(
  sendToVercel,
  typeof window !== "undefined" &&
    import.meta.env.PROD &&
    shouldEnableAnalytics(window.location.hostname),
);

export function redactAnalyticsEvent(
  event: BeforeSendEvent,
): BeforeSendEvent | null {
  const rawUrl = validateRawAnalyticsUrl(event.url);
  if (!rawUrl) return null;

  try {
    const url = new URL(event.url);
    const canonicalPath = canonicalPathForPathname(url.pathname);
    if (
      url.username ||
      url.password ||
      url.port ||
      url.host !== rawUrl.authority ||
      url.pathname !== rawUrl.pathname ||
      !shouldEnableAnalytics(url.hostname) ||
      canonicalPath === undefined
    ) {
      return null;
    }
    const safeOrigin =
      url.hostname === canonicalHostname
        ? CANONICAL_SITE_ORIGIN
        : `https://${url.hostname}`;
    return { ...event, url: `${safeOrigin}${canonicalPath}` };
  } catch {
    return null;
  }
}
