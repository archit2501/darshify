// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
  createOutcomeTracker,
  redactAnalyticsEvent,
  shouldEnableAnalytics,
  trackOutcome,
  type OutcomeEvent,
} from "./outcomes";

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

  it("removes query strings and fragments from Vercel page-view URLs", () => {
    expect(
      redactAnalyticsEvent({
        type: "pageview",
        url: "https://preview.test/search?q=private#result",
      }),
    ).toEqual({ type: "pageview", url: "https://preview.test/search" });
    expect(
      redactAnalyticsEvent({
        type: "event",
        url: "not a valid URL",
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
