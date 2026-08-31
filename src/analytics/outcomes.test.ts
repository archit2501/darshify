// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
  createOutcomeTracker,
  redactAnalyticsEvent,
  shouldEnableAnalytics,
  trackOutcome,
  type OutcomeEvent,
} from "./outcomes";
import {
  CANONICAL_SITE_ORIGIN,
  canonicalRouteInventory,
  routeIdForPathname,
} from "../seo/meta";

const allEvents: OutcomeEvent[] = [
  "cv_download",
  "email_open",
  "linkedin_open",
  "case_study_open",
  "evidence_open",
  "career_mix_complete",
];

describe("privacy-safe outcome analytics", () => {
  it("exposes exactly the six approved outcome names at the vendor boundary", () => {
    const transport = vi.fn();
    const send = createOutcomeTracker(transport, true);

    allEvents.forEach((name) =>
      expect(
        send(name, {
          routeId: "case-study:r1",
          caseStudyId: "r1",
          evidenceId: "figmenta-resumes",
          placement: "case-study",
        }),
      ).toBe(true),
    );

    expect(transport).toHaveBeenCalledTimes(6);
    expect(transport).toHaveBeenLastCalledWith("career_mix_complete", {
      routeId: "case-study:r1",
      caseStudyId: "r1",
      evidenceId: "figmenta-resumes",
      placement: "case-study",
    });
  });

  it.each([
    ["email", "darshijain0809@gmail.com"],
    ["phone", "+91 9268264843"],
    ["search", "operations recruiter"],
    ["url", "https://example.test/case?candidate=darshil"],
    ["profile", "darshil-jain-611a3332b"],
    ["anything", "arbitrary string"],
  ])("rejects the unapproved %s property before transport", (key, value) => {
    const transport = vi.fn();
    const send = createOutcomeTracker(transport, true);

    expect(() => send("case_study_open", { [key]: value } as never)).toThrow(
      /analytics propert|approved analytics/i,
    );
    expect(transport).not.toHaveBeenCalled();
  });

  it.each([
    ["routeId", "/case-studies/r1?email=private"],
    ["caseStudyId", "missing-case"],
    ["evidenceId", "https://example.test/?proof=private"],
    ["placement", "personal-profile"],
  ])("rejects an unvalidated %s value", (key, value) => {
    const send = createOutcomeTracker(vi.fn(), true);
    expect(() => send("evidence_open", { [key]: value } as never)).toThrow(
      /approved analytics/i,
    );
  });

  it("does not send from the default test or server boundary", () => {
    expect(
      trackOutcome("cv_download", {
        routeId: "home",
        placement: "hero",
      }),
    ).toBe(false);
  });

  it("rejects unapproved event names before transport", () => {
    const transport = vi.fn();
    const send = createOutcomeTracker(transport, true);
    expect(() => send("portfolio_view" as OutcomeEvent, {})).toThrow(
      /approved analytics event/i,
    );
    expect(transport).not.toHaveBeenCalled();
  });

  it("allows only canonical routes and normalizes their trailing slash", () => {
    canonicalRouteInventory.forEach(({ path }) => {
      const canonicalPath = path === "/" ? "/" : path;
      const withOptionalSlash = path === "/" ? "/" : `${path}/`;

      expect(
        redactAnalyticsEvent({
          type: "pageview",
          url: `${CANONICAL_SITE_ORIGIN}${withOptionalSlash}?utm_source=private#result`,
        }),
      ).toEqual({
        type: "pageview",
        url: `${CANONICAL_SITE_ORIGIN}${canonicalPath}`,
      });
    });

    expect(
      redactAnalyticsEvent({
        type: "event",
        url: "not a valid URL",
      }),
    ).toBeNull();
  });

  it.each(["//", "///", "////", "/artist//"])(
    "never resolves a repeated-slash path as a canonical route: %s",
    (pathname) => {
      expect(routeIdForPathname(pathname)).toBeUndefined();
    },
  );

  it.each([
    `${CANONICAL_SITE_ORIGIN}//`,
    `${CANONICAL_SITE_ORIGIN}///`,
    `${CANONICAL_SITE_ORIGIN}////`,
    `${CANONICAL_SITE_ORIGIN}/artist//`,
    `${CANONICAL_SITE_ORIGIN}/%2F`,
    `${CANONICAL_SITE_ORIGIN}/%5C`,
    `${CANONICAL_SITE_ORIGIN}/artist/%2F`,
    `${CANONICAL_SITE_ORIGIN}/artist/%5C`,
    `${CANONICAL_SITE_ORIGIN}/\\`,
    `${CANONICAL_SITE_ORIGIN}/artist/\\`,
  ])("drops a slash or backslash bypass before transport: %s", (url) => {
    const vendor = vi.fn();
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const candidate = redactAnalyticsEvent({ type: "pageview", url });

    if (candidate) vendor(candidate);

    expect(candidate).toBeNull();
    expect(vendor).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it.each([
    "/case-studies/darshil.jain@example.com",
    "/playlist/+91-9268264843",
    "/search/operations-recruiter",
    "/artist/darshil-jain-611a3332b",
    "/private/arbitrary-sensitive-string",
    "/case-studies/figmenta-operations-intern/private",
    "/artist//",
  ])("drops an unknown path before the vendor boundary: %s", (path) => {
    const vendor = vi.fn();
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const candidate = redactAnalyticsEvent({
      type: "pageview",
      url: `${CANONICAL_SITE_ORIGIN}${path}?email=darshil.jain@example.com&phone=919268264843&search=operations-recruiter&profile=darshil-jain-611a3332b#arbitrary-sensitive-string`,
    });

    if (candidate) vendor(candidate);

    expect(candidate).toBeNull();
    expect(vendor).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it("strips sensitive query and fragment values from an allowed route before transport", () => {
    const vendor = vi.fn();
    const candidate = redactAnalyticsEvent({
      type: "pageview",
      url: `${CANONICAL_SITE_ORIGIN}/search?email=darshil.jain@example.com&phone=919268264843&search=operations-recruiter&profile=darshil-jain-611a3332b&url=https%3A%2F%2Fexample.test%2Fcase%3Fcandidate%3Ddarshil#email=darshil.jain@example.com&phone=919268264843&arbitrary-sensitive-string`,
    });

    if (candidate) vendor(candidate);

    expect(vendor).toHaveBeenCalledExactlyOnceWith({
      type: "pageview",
      url: `${CANONICAL_SITE_ORIGIN}/search`,
    });
    expect(JSON.stringify(vendor.mock.calls)).not.toMatch(
      /darshil|9268264843|operations-recruiter|arbitrary-sensitive-string/i,
    );
  });

  it("drops an allowlisted path received from an unapproved host", () => {
    expect(
      redactAnalyticsEvent({
        type: "pageview",
        url: "https://profiles.example.test/artist?email=private#phone",
      }),
    ).toBeNull();
  });

  it.each([
    ["wrapped-portfolio.vercel.app", true],
    ["wrapped-portfolio-git-feature-archits-projects.vercel.app", true],
    ["127.0.0.1", false],
    ["localhost", false],
    ["wrapped-portfolio.vercel.app.example.test", false],
  ])(
    "enables the vendor only on an approved production host",
    (host, enabled) => {
      expect(shouldEnableAnalytics(host)).toBe(enabled);
    },
  );
});
