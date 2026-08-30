# Darshify Recruiter-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Darshify into a truthful, recruiter-first, Spotify-themed portfolio with sourced case studies, a Proof Waveform, a silent Career Mix, static prerendering, and release-blocking accessibility and performance gates.

**Architecture:** Typed static evidence becomes the source of truth, and Spotify-style tracks, releases, shelves, and search results become presentation adapters. React Router 7 Framework Mode prerenders every primary and case-study route while preserving client navigation. A focused Career Mix reducer owns the only timed interaction; the rest of the application remains URL and content driven.

**Tech Stack:** React 19, TypeScript 6, React Router 7 Framework Mode, Tailwind CSS 4, Motion 13 with LazyMotion, Vitest 4, Testing Library, Playwright, Axe, Lighthouse CI, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-31-darshify-recruiter-first-redesign.md`

## Global Constraints

- The portfolio remains Spotify-themed throughout, but must use no Spotify logo, trademarked art, or copied proprietary assets.
- Remove all fabricated listeners, plays, durations, verification labels, rankings, follow/like state, ambient audio, shuffle, repeat, and decorative queue behavior.
- Every quantitative claim must have source, period, and verification status.
- CV, Email, LinkedIn, and Start Career Mix must remain in the first Home viewport at 390×844 and 1440×900.
- Meet WCAG 2.2 AA with automated Axe and manual keyboard, screen-reader, zoom, contrast, touch-target, and reduced-motion verification.
- New and modified runtime code must achieve at least 90% test coverage.
- Initial transfer must stay at or below 1.0MiB total, 700KiB images, and 150KiB gzip JavaScript.
- Direct lookup is O(1), search/filter is O(n), explicit sorting is O(n log n), and interaction work remains below 50ms.
- Motion 13 is the only JavaScript animation runtime; keep Darshify's original inline SVG icon system.
- No CMS, backend, recorded narration, fuzzy-search library, or second state-management library.
- Every task closes only after lint, type-check, format check, affected tests, production build, and task smoke test pass.

## Planned File Structure

```text
app/
├── root.tsx                         # Framework document, providers, metadata shell
├── routes.ts                       # Stable public route declarations
└── routes/                          # Route modules and per-route metadata/loaders
src/
├── analytics/outcomes.ts            # Privacy-safe conversion event API
├── career-mix/                      # Reducer, context, dock, chapter UI, tests
├── components/
│   ├── ContactActions.tsx           # CV/email/LinkedIn conversion cluster
│   ├── EvidenceCover.tsx            # Responsive artifact/fact-led cover
│   ├── ProofWaveform.tsx            # Accessible evidence signature
│   └── RecruiterHero.tsx            # First-viewport briefing component
├── content/
│   ├── types.ts                     # Evidence-first domain interfaces
│   ├── portfolio.ts                 # Single static source of truth
│   ├── selectors.ts                 # O(1) maps, O(n) search/filter adapters
│   ├── validate.ts                  # Referential and truth validation
│   └── *.test.ts                    # Model, selector, and validation coverage
├── pages/                           # Home, Artist, case study, Search, Library, 404
├── shell/                           # Semantic responsive app shell and release UI
└── styles/                          # Tokens, focus, motion, and typography policy
e2e/                                 # Recruiter, Career Mix, route, a11y, responsive tests
scripts/                             # Content/link/performance budget checks
public/artifacts/                    # Optimized real/redacted or fact-led evidence art
react-router.config.ts               # Static prerender route list
playwright.config.ts                 # Browser matrix and local server contract
.github/workflows/ci.yml             # Quality → unit → build → browser gates
```

---

### Task 1 (1.1.1): Establish reproducible quality gates and CI

**Files:**

- Create: `.node-version`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `.github/workflows/ci.yml`
- Create: `playwright.config.ts`
- Create: `e2e/baseline.spec.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Modify: `eslint.config.js`

**Interfaces:**

- Consumes: current Vite application and existing Vitest suite.
- Produces: `npm run type-check`, `format:check`, `test:coverage`, `test:e2e`, and `check`; CI jobs named `quality`, `test`, `build`, and `browser`.

- [ ] **Step 1: Pin the runtime and define quality scripts**

Use Node 24 in `.node-version` and add these scripts to `package.json`:

```json
{
  "scripts": {
    "type-check": "tsc -b --pretty false",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "check": "npm run format:check && npm run lint && npm run type-check && npm run test:coverage && npm run build"
  }
}
```

- [ ] **Step 2: Install test and formatting dependencies**

Run:

```bash
npm install --save-dev prettier @vitest/coverage-v8 @playwright/test @axe-core/playwright
npx playwright install chromium
```

Expected: lockfile records the four packages and Chromium installs successfully.

- [ ] **Step 3: Add the failing browser baseline**

Create `e2e/baseline.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("primary routes render one visible heading without console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  for (const path of ["/", "/artist", "/search", "/library"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
```

- [ ] **Step 4: Verify the new browser test fails before configuration**

Run: `npm run test:e2e -- e2e/baseline.spec.ts`  
Expected: FAIL because Playwright has no web-server configuration.

- [ ] **Step 5: Configure Playwright and coverage**

Set Playwright to Chromium, `baseURL: "http://127.0.0.1:5173"`, screenshot/trace on failure, and a web server command of `npm run dev -- --host 127.0.0.1`. Configure Vitest to emit text, JSON-summary, and HTML coverage without imposing a legacy-code global threshold yet; all later tasks run targeted tests for their new modules.

- [ ] **Step 6: Add the required CI workflow**

Use Node 24 and `npm ci`. Make `test` depend on `quality`, `build` depend on `test`, and `browser` depend on `build`. The browser job installs Chromium and runs `npm run test:e2e`.

- [ ] **Step 7: Run the complete foundation gate**

Run:

```bash
npm run format
npm run check
npm run test:e2e
```

Expected: all commands exit 0 and the browser test covers all four routes.

- [ ] **Step 8: Commit**

```bash
git add .node-version .prettierrc.json .prettierignore .github/workflows/ci.yml playwright.config.ts e2e/baseline.spec.ts package.json package-lock.json vite.config.ts eslint.config.js
git commit -m "ci: add Darshify quality gates [1.1.1]"
```

---

### Task 2 (1.2.1): Create the evidence-first content model

**Files:**

- Create: `src/content/types.ts`
- Create: `src/content/portfolio.ts`
- Create: `src/content/selectors.ts`
- Create: `src/content/validate.ts`
- Create: `src/content/content.test.ts`
- Create: `src/content/selectors.test.ts`
- Modify: `src/data/library.ts`

**Interfaces:**

- Consumes: facts currently encoded in `src/data/library.ts` and the résumé at `public/Darshil_Jain_Resume.pdf`.
- Produces: `portfolio`, `caseStudyById`, `caseStudyBySlug`, `proofById`, `searchPortfolio(query)`, `collections`, and `validatePortfolio(portfolio)`.

- [ ] **Step 1: Write failing integrity and truth tests**

```ts
import { describe, expect, it } from "vitest";
import { portfolio } from "./portfolio";
import { validatePortfolio } from "./validate";

describe("portfolio content", () => {
  it("has no unresolved references or unsupported quantitative claims", () => {
    expect(validatePortfolio(portfolio)).toEqual([]);
  });

  it("contains no simulated popularity or playback fields", () => {
    const serialized = JSON.stringify(portfolio);
    expect(serialized).not.toMatch(
      /monthlyListeners|plays|durationSec|verifiedCandidate/,
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npm test -- src/content/content.test.ts`  
Expected: FAIL because the evidence modules do not exist.

- [ ] **Step 3: Define the domain interfaces**

Create exact exported types for `CandidateProfile`, `EvidenceSource`, `ProofPoint`, `Artifact`, `CaseStudy`, `Collection`, `CareerMixChapter`, and `Portfolio`. Use:

```ts
export type EvidenceStatus = "verified" | "self-reported" | "redacted";

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
  proofIds: string[];
  artifactIds: string[];
  skills: string[];
  relatedIds: string[];
}
```

- [ ] **Step 4: Populate truthful static content**

Use the résumé as the source for résumé-derived claims and mark them `self-reported` unless a separate artifact verifies them. Preserve exact dates and scope. Do not convert the old `plays`, `durationSec`, listener count, or “Verified Candidate” fields.

- [ ] **Step 5: Implement deterministic selectors and validation**

Build maps once at module initialization for O(1) lookup. Normalize searchable text once per case study, then implement O(n) filtering:

```ts
const normalize = (value: string) =>
  value.normalize("NFKD").toLowerCase().trim();
const caseStudySlugMap = new Map(
  portfolio.caseStudies.map((item) => [item.slug, item]),
);

export const caseStudyBySlug = (slug: string) => caseStudySlugMap.get(slug);
export const searchPortfolio = (query: string) => {
  const needle = normalize(query);
  return needle
    ? searchableCaseStudies.filter((item) => item.searchText.includes(needle))
    : [];
};
```

Validation returns descriptive strings for duplicate IDs/slugs, unresolved references, quantitative claims without source/period/status, and artifacts without alt text/provenance.

- [ ] **Step 6: Convert the legacy library into a temporary presentation adapter**

Keep existing pages compiling while deriving their titles, subtitles, covers, and collection membership from `portfolio`. Remove `plays`, `durationSec`, fake listener count, and fake verification from the adapter API; page migration tasks must stop rendering these fields.

- [ ] **Step 7: Run targeted and global gates**

Run:

```bash
npm test -- src/content/content.test.ts src/content/selectors.test.ts src/data/library.test.ts
npm run lint
npm run type-check
npm run build
```

Expected: all pass; coverage for `src/content/**` is at least 90%.

- [ ] **Step 8: Commit**

```bash
git add src/content src/data/library.ts src/data/library.test.ts
git commit -m "refactor: model sourced portfolio evidence [1.2.1]"
```

---

### Task 3 (1.3.1): Migrate to React Router Framework Mode and prerender routes

**Files:**

- Create: `react-router.config.ts`
- Create: `app/root.tsx`
- Create: `app/routes.ts`
- Create: `app/routes/home.tsx`
- Create: `app/routes/artist.tsx`
- Create: `app/routes/search.tsx`
- Create: `app/routes/library.tsx`
- Create: `app/routes/collection.tsx`
- Create: `app/routes/case-study.tsx`
- Create: `app/routes/not-found.tsx`
- Create: `e2e/prerender.spec.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Modify: `tsconfig.node.json`
- Modify: `vercel.json`
- Remove after parity is proven: `src/main.tsx`, `src/App.tsx`

**Interfaces:**

- Consumes: `portfolio`, `caseStudyBySlug`, current page components, and `AppShell`.
- Produces: Framework Mode route modules, static HTML for primary routes, and compatible legacy URLs.

- [ ] **Step 1: Write failing route and prerender assertions**

Extend `e2e/prerender.spec.ts` to request `/`, `/artist`, `/playlist/projects`, and the first case-study slug with JavaScript disabled, then assert the candidate or route heading exists in returned HTML.

- [ ] **Step 2: Verify failure against the SPA**

Run: `npm run test:e2e -- e2e/prerender.spec.ts`  
Expected: FAIL because current HTML contains only the application root.

- [ ] **Step 3: Install Framework Mode packages and scripts**

Run:

```bash
npm install react-router @react-router/node @react-router/serve
npm install --save-dev @react-router/dev
```

Replace Vite entry scripts with `react-router dev`, `react-router build`, and `react-router-serve ./build/server/index.js`. Keep `npm run build` as the production gate.

- [ ] **Step 4: Declare routes and prerender paths**

Use this route contract in `app/routes.ts`:

```ts
import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("artist", "routes/artist.tsx"),
  route("search", "routes/search.tsx"),
  route("library", "routes/library.tsx"),
  route("playlist/:id", "routes/collection.tsx"),
  route("liked", "routes/collection.tsx"),
  route("case-studies/:slug", "routes/case-study.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
```

`react-router.config.ts` returns all fixed routes, collection IDs, and case-study slugs from the typed portfolio. Use static prerendering with client navigation retained.

- [ ] **Step 5: Build the document root and route modules**

`app/root.tsx` owns `Meta`, `Links`, `ScrollRestoration`, `Scripts`, error boundaries, providers, and `AppShell`. Each route exports a unique `meta` function and renders the corresponding page. The initial case-study route renders a semantic title, recruiter takeaway, and link back to projects until Task 10 supplies the complete layout.

- [ ] **Step 6: Replace SPA rewrites with Framework Mode deployment output**

Update `vercel.json` for React Router's generated static/server output. Do not rewrite every extensionless request to `index.html`; allow prerendered route assets and 404 behavior to resolve normally.

- [ ] **Step 7: Verify route parity and static HTML**

Run:

```bash
npm run type-check
npm run build
npm run test:e2e -- e2e/baseline.spec.ts e2e/prerender.spec.ts
```

Expected: legacy routes navigate, case-study paths render, JavaScript-disabled HTML contains headings, and unknown paths show the designed 404.

- [ ] **Step 8: Remove obsolete SPA entry files and commit**

```bash
git add app react-router.config.ts package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json vercel.json e2e/prerender.spec.ts
git rm src/main.tsx src/App.tsx
git commit -m "feat: prerender portfolio routes [1.3.1]"
```

---

### Task 4 (2.1.1): Implement the editorial design system and Motion policy

**Files:**

- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/motion/MotionProvider.tsx`
- Create: `src/motion/motion.test.tsx`
- Modify: `src/index.css`
- Modify: `src/lib/useReducedMotion.ts`
- Modify: `src/shell/AppShell.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Remove: `public/fonts/Display.ttf`

**Interfaces:**

- Consumes: approved color, typography, spacing, motion, and reduced-motion rules.
- Produces: semantic CSS tokens, Archivo/Plex typography, `MotionProvider`, and reduced-motion-safe transitions.

- [ ] **Step 1: Write failing token and reduced-motion tests**

Test that the provider passes `reducedMotion="user"`, the root exposes the `--color-signal` token, and reduced-motion mode renders final UI state without initial translation.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/motion/motion.test.tsx`  
Expected: FAIL because the provider and approved tokens do not exist.

- [ ] **Step 3: Replace the animation and font dependencies**

Run:

```bash
npm uninstall framer-motion
npm install motion @fontsource-variable/archivo @fontsource/ibm-plex-mono
```

Use `motion/react` imports and `LazyMotion` with `domAnimation`. Do not introduce another animation package.

- [ ] **Step 4: Define the approved tokens**

Set `ink #000000`, `panel #121212`, `elevated #1B1B1B`, `line #303030`, `text #F7F7F5`, `muted #B3B3B3`, and `signal #1ED760`. Add the locked spacing and type scales, 44px target minimum, focus-ring token, 65–72ch reading width, and 120–260ms transition tokens.

- [ ] **Step 5: Apply typography and motion policy**

Use Archivo for UI/body and IBM Plex Mono only for evidence metadata. Replace `transition-all`, idle pulses, and unbounded motion. In reduced-motion mode, disable smooth scrolling and motion transforms while preserving visibility.

- [ ] **Step 6: Remove the unproven bundled font and verify payload**

Delete `public/fonts/Display.ttf`, confirm font licensing through package metadata, and ensure only the required font weights/styles enter the build.

- [ ] **Step 7: Run quality gates and commit**

```bash
npm test -- src/motion/motion.test.tsx src/lib/useReducedMotion.test.ts
npm run lint
npm run type-check
npm run build
git add src/styles src/motion src/index.css src/lib/useReducedMotion.ts src/shell/AppShell.tsx package.json package-lock.json
git rm public/fonts/Display.ttf
git commit -m "style: establish evidence-led design system [2.1.1]"
```

---

### Task 5 (2.2.1): Build the semantic responsive shell and conversion primitives

**Files:**

- Create: `src/components/ContactActions.tsx`
- Create: `src/components/ContactActions.test.tsx`
- Create: `src/shell/RouteFocus.tsx`
- Create: `src/shell/SkipLink.tsx`
- Modify: `src/shell/AppShell.tsx`
- Modify: `src/shell/Sidebar.tsx`
- Modify: `src/shell/TopBar.tsx`
- Modify: `src/shell/BottomNav.tsx`
- Modify: `src/icons/icons.tsx`
- Create: `e2e/shell-accessibility.spec.ts`

**Interfaces:**

- Consumes: `portfolio.candidate`, Framework Mode root, design tokens.
- Produces: `ContactActions`, named navigation landmarks, route-focus behavior, responsive rail/top/bottom navigation, and an unambiguous main-content target.

- [ ] **Step 1: Write failing semantic and conversion tests**

```tsx
render(<ContactActions candidate={portfolio.candidate} placement="hero" />);
expect(screen.getByRole("link", { name: /download cv/i })).toHaveAttribute(
  "href",
  "/Darshil_Jain_Resume.pdf",
);
expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute(
  "href",
  expect.stringMatching(/^mailto:/),
);
expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
  "rel",
  expect.stringContaining("noreferrer"),
);
```

The browser test asserts a skip link, named primary/mobile navigation, exactly one main landmark, visible focus, and conversion controls at 390×844 and 1440×900.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/components/ContactActions.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement conversion and focus primitives**

`ContactActions` renders semantic links with a placement-aware layout and a tracking callback supplied later. `RouteFocus` moves focus to the route `<h1>` only after client navigation and gives it a designed focus state. `SkipLink` targets `#main-content`.

- [ ] **Step 4: Refactor the shell landmarks and responsive layout**

Use a 216–232px desktop rail, a single scrollable main region, and mobile bottom navigation. Remove duplicate CV visibility rules; conversion is owned by `ContactActions`. Keep the current player temporarily until Task 7 replaces it, but remove global Space/arrow handlers that steal ordinary page interaction.

- [ ] **Step 5: Verify keyboard and viewport behavior**

Run:

```bash
npm test -- src/components/ContactActions.test.tsx
npm run test:e2e -- e2e/shell-accessibility.spec.ts
npm run lint
npm run type-check
npm run build
```

Expected: all conversion links work, keyboard focus is visible, and no CTA is hidden on mobile.

- [ ] **Step 6: Commit**

```bash
git add src/components/ContactActions.tsx src/components/ContactActions.test.tsx src/shell src/icons/icons.tsx e2e/shell-accessibility.spec.ts
git commit -m "feat: add recruiter-focused app shell [2.2.1]"
```

---

### Task 6 (2.3.1): Build artifact-led covers and the Proof Waveform

**Files:**

- Create: `src/components/EvidenceCover.tsx`
- Create: `src/components/EvidenceCover.test.tsx`
- Create: `src/components/ProofWaveform.tsx`
- Create: `src/components/ProofWaveform.test.tsx`
- Create: `src/content/waveform.ts`
- Create: `public/artifacts/*.svg`
- Modify: `src/shell/Art.tsx`
- Remove after replacement: `public/covers/*.png`

**Interfaces:**

- Consumes: `Artifact[]`, `ProofPoint[]`, evidence sources, and reduced-motion policy.
- Produces: `EvidenceCover({ artifact, aspect, priority })`, `ProofWaveform({ points, compact })`, and `buildWaveformData(proofPoints)`.

- [ ] **Step 1: Write failing waveform and cover tests**

```tsx
render(<ProofWaveform points={portfolio.proofPoints.slice(0, 3)} />);
expect(
  screen.getByRole("img", { name: /career proof waveform/i }),
).toBeVisible();
expect(screen.getAllByRole("link")).toHaveLength(3);
```

Cover tests assert meaningful alt text, declared aspect ratio, responsive `srcSet` where an image exists, and a fact-led SVG fallback when it does not.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/components/ProofWaveform.test.tsx src/components/EvidenceCover.test.tsx`  
Expected: FAIL because neither component exists.

- [ ] **Step 3: Implement deterministic waveform data**

Normalize numeric proof values against the maximum in the visible series, retain source labels, and never imply that height is popularity. Each peak uses the proof ID, label, display value, case-study URL, source label, and verification status.

- [ ] **Step 4: Implement accessible SVG and static reduced-motion state**

The waveform uses a labelled `<svg role="img">`, keyboard-reachable evidence links, and a plain-text evidence list. Motion draws the path once only when allowed; reduced motion renders the final path immediately.

- [ ] **Step 5: Replace generic cover art**

Create fact-led typographic SVG covers from approved case-study results when real artifacts are unavailable. Include the organization/project label, one sourced proof value, and one category signal. No generic 3D imagery or synthetic screenshots.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- src/components/ProofWaveform.test.tsx src/components/EvidenceCover.test.tsx
npm run lint
npm run type-check
npm run build
git add src/components/EvidenceCover.tsx src/components/EvidenceCover.test.tsx src/components/ProofWaveform.tsx src/components/ProofWaveform.test.tsx src/content/waveform.ts src/shell/Art.tsx public/artifacts
git rm -r public/covers
git commit -m "feat: add sourced Proof Waveform artwork [2.3.1]"
```

---

### Task 7 (2.4.1): Replace simulated playback with the silent Career Mix

**Files:**

- Create: `src/career-mix/reducer.ts`
- Create: `src/career-mix/reducer.test.ts`
- Create: `src/career-mix/CareerMixContext.tsx`
- Create: `src/career-mix/CareerMixContext.test.tsx`
- Create: `src/career-mix/CareerMixDock.tsx`
- Create: `src/career-mix/CareerMixDock.test.tsx`
- Modify: `app/root.tsx`
- Modify: `src/shell/AppShell.tsx`
- Remove: `src/shell/PlayerBar.tsx`
- Remove: `src/shell/NowPlayingPanel.tsx`
- Remove: `src/shell/QueuePanel.tsx`

**Interfaces:**

- Consumes: `portfolio.careerMix`, case-study/proof selectors, and `ContactActions` tracking hook.
- Produces: `useCareerMix()` with `open`, `toggle`, `next`, `previous`, `close`, `state`, `activeChapter`, and `progressRatio`.

- [ ] **Step 1: Write failing reducer tests**

```ts
expect(reduce(initialState, { type: "OPEN" })).toMatchObject({
  status: "playing",
  chapterIndex: 0,
  elapsedMs: 0,
});
expect(
  reduce({ ...playing, chapterIndex: 0 }, { type: "PREVIOUS" }).chapterIndex,
).toBe(0);
expect(reduce(lastChapter, { type: "NEXT" }).status).toBe("complete");
expect(reduce(playing, { type: "TICK", deltaMs: 250 }).elapsedMs).toBe(250);
```

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/career-mix/reducer.test.ts`  
Expected: FAIL because the reducer does not exist.

- [ ] **Step 3: Implement the state machine and focused timer**

Use statuses `closed | paused | playing | complete`. Clamp chapter indices, allocate exactly 60,000ms across chapters, and tick the provider at 250ms only while playing. Do not update the app shell at animation-frame frequency.

- [ ] **Step 4: Implement the dock and accessibility behavior**

Render the dock only when status is not `closed`. Include chapter label, takeaway, evidence deep link, progress, previous, pause/play, next, and close. Announce chapter changes through a polite live region. Return focus to the trigger on close.

- [ ] **Step 5: Remove legacy playback and dead semantics**

Delete the visible player bar, queue, and now-playing panels, and stop exposing ambient audio, fake seek/volume, likes, shuffle, and repeat in the product UI. Keep `PlayerContext`, `engine`, and `useAmbient` as a deprecated compile-only compatibility layer for the still-unmigrated Artist/collection pages; Task 9 removes that layer immediately after those consumers move to proof rows.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- src/career-mix
npm run lint
npm run type-check
npm run build
git add app/root.tsx src/career-mix src/shell/AppShell.tsx
git rm src/shell/PlayerBar.tsx src/shell/NowPlayingPanel.tsx src/shell/QueuePanel.tsx
git commit -m "feat: replace fake playback with Career Mix [2.4.1]"
```

---

### Task 8 (3.1.1): Rebuild Home as the recruiter briefing

**Files:**

- Create: `src/components/RecruiterHero.tsx`
- Create: `src/components/RecruiterHero.test.tsx`
- Create: `src/pages/Home.test.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/shell/MediaCard.tsx`
- Modify: `src/shell/Shelf.tsx`
- Modify: `app/routes/home.tsx`
- Create: `e2e/recruiter-home.spec.ts`

**Interfaces:**

- Consumes: candidate profile, selected proof points, three recruiter essentials, `ContactActions`, `ProofWaveform`, `EvidenceCover`, and `useCareerMix().open`.
- Produces: first-viewport recruiter briefing and evidence-led Home shelves.

- [ ] **Step 1: Write failing first-viewport and semantics tests**

Unit tests assert one `<h1>`, target role, proposition, a sourced proof point, CV/Email/LinkedIn, and Start Career Mix. The browser test checks all elements are visible without scrolling at 390×844 and 1440×900.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/components/RecruiterHero.test.tsx src/pages/Home.test.tsx`  
Expected: FAIL because Home still renders a generic greeting and fake quick picks.

- [ ] **Step 3: Implement the recruiter hero**

Use the locked 40/56px hero scale, concise proposition, one primary proof statement with source label, candidate artwork, and the four conversion controls. The time-aware greeting may appear as small secondary metadata only.

- [ ] **Step 4: Replace quick picks and fake rankings**

Render exactly three Recruiter Essentials: one experience, one project, and one achievement selected in typed content. Replace “Your Top Hits,” invented popularity sorting, and card-level Play buttons with ordered evidence shelves and “Read case study” links.

- [ ] **Step 5: Verify first-view conversion and navigation**

Run:

```bash
npm test -- src/components/RecruiterHero.test.tsx src/pages/Home.test.tsx
npm run test:e2e -- e2e/recruiter-home.spec.ts
npm run lint
npm run type-check
npm run build
```

Expected: all first-viewport controls are visible and keyboard reachable at both locked sizes.

- [ ] **Step 6: Commit**

```bash
git add src/components/RecruiterHero.tsx src/components/RecruiterHero.test.tsx src/pages/Home.tsx src/pages/Home.test.tsx src/shell/MediaCard.tsx src/shell/Shelf.tsx app/routes/home.tsx e2e/recruiter-home.spec.ts
git commit -m "feat: make Home a recruiter briefing [3.1.1]"
```

---

### Task 9 (3.2.1): Rebuild Artist and release rows around sourced proof

**Files:**

- Create: `src/components/ProofTrackRow.tsx`
- Create: `src/components/ProofTrackRow.test.tsx`
- Create: `src/components/ReleaseCard.tsx`
- Create: `src/components/ReleaseCard.test.tsx`
- Create: `src/pages/ArtistPage.test.tsx`
- Modify: `src/pages/ArtistPage.tsx`
- Modify: `src/pages/PlaylistPage.tsx`
- Modify: `src/pages/LikedSongs.tsx`
- Modify: `app/routes/artist.tsx`
- Modify: `app/routes/collection.tsx`
- Remove: `src/shell/TrackRow.tsx`
- Remove: `src/shell/TrackRow.test.tsx`
- Remove: `src/player/PlayerContext.tsx`
- Remove: `src/player/engine.ts`
- Remove: `src/player/engine.test.ts`
- Remove: `src/player/useAmbient.ts`

**Interfaces:**

- Consumes: candidate, ordered proof tracks, collections, case-study routes, `ContactActions`, `ProofWaveform`, and evidence covers.
- Produces: `ProofTrackRow` with visible outcome/source/action and `ReleaseCard` with professional and themed labels.

- [ ] **Step 1: Write failing truth and interaction tests**

Assert the Artist page contains no text matching `verified candidate`, `monthly listeners`, `follow`, or simulated play counts. Assert each proof row has a case-study link, outcome, source label, and keyboard-visible action.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/pages/ArtistPage.test.tsx src/components/ProofTrackRow.test.tsx`  
Expected: FAIL against the current Artist page and TrackRow.

- [ ] **Step 3: Implement evidence-led rows and release cards**

`ProofTrackRow` uses a semantic article/list item, visible title, organization/period, recruiter takeaway, proof value, source status, and “Read case study.” `ReleaseCard` uses one professional category label and one secondary Spotify-style release label.

- [ ] **Step 4: Rebuild the Artist hierarchy**

Render proposition and conversion first, followed by Selected Impact, Proof Waveform, Career Releases, About, education/skills, availability, and final contact block. Keep hero artwork atmospheric but never allow it to displace proof on mobile.

- [ ] **Step 5: Migrate collection and achievement routes**

Use collection data and proof rows. Preserve `/playlist/:id` and `/liked`, but replace “Liked Songs” ownership semantics with truthful achievement/release labels and redirects/canonical metadata where appropriate.

After Artist, collection, achievement, MediaCard, and Home consumers no longer import `usePlayer`, delete the deprecated compatibility provider, engine, tests, ambient-audio hook, and their local-storage keys. Confirm `rg "usePlayer|PlayerProvider|durationSec|plays|toggleLike|toggleAudio" src app` returns no simulated-player consumers.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- src/pages/ArtistPage.test.tsx src/components/ProofTrackRow.test.tsx src/components/ReleaseCard.test.tsx
npm run lint
npm run type-check
npm run build
git add src/components/ProofTrackRow.tsx src/components/ProofTrackRow.test.tsx src/components/ReleaseCard.tsx src/components/ReleaseCard.test.tsx src/pages app/routes/artist.tsx app/routes/collection.tsx
git rm src/shell/TrackRow.tsx src/shell/TrackRow.test.tsx src/player/PlayerContext.tsx src/player/engine.ts src/player/engine.test.ts src/player/useAmbient.ts
git commit -m "feat: turn releases into sourced career proof [3.2.1]"
```

---

### Task 10 (3.3.1): Build complete, shareable case-study pages

**Files:**

- Create: `src/components/CaseStudyHeader.tsx`
- Create: `src/components/EvidencePanel.tsx`
- Create: `src/pages/CaseStudyPage.tsx`
- Create: `src/pages/CaseStudyPage.test.tsx`
- Modify: `app/routes/case-study.tsx`
- Modify: `react-router.config.ts`
- Modify: `src/pages/NotFound.tsx`
- Create: `e2e/case-studies.spec.ts`

**Interfaces:**

- Consumes: `caseStudyBySlug`, `proofById`, artifact selector, related-case selector, and contact actions.
- Produces: complete Situation → Action → Result → Evidence pages and a recoverable missing-slug state.

- [ ] **Step 1: Write failing route and content tests**

For every case study, render the route and assert one heading, organization/period, recruiter takeaway, Situation, Action, Result, Evidence, source/verification text, and contact actions. Missing slugs must return/render a 404 state rather than the first item.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/pages/CaseStudyPage.test.tsx`  
Expected: FAIL because the route is only a semantic summary.

- [ ] **Step 3: Implement the complete case-study composition**

Use an evidence reading width of 680–760px. Keep the recruiter takeaway and strongest sourced result above the fold; place artifacts beside or immediately after the evidence they support. Label redaction and self-reported evidence explicitly.

- [ ] **Step 4: Add metadata and prerender coverage for every slug**

Return route-specific title, description, canonical URL, Open Graph fields, and structured data derived from content. Add all slugs to `react-router.config.ts` and make invalid slugs produce a 404 response boundary.

- [ ] **Step 5: Verify shareability and recovery**

Run:

```bash
npm test -- src/pages/CaseStudyPage.test.tsx
npm run build
npm run test:e2e -- e2e/case-studies.spec.ts e2e/prerender.spec.ts
```

Expected: every case route is prerendered, works without JavaScript for core content, and unknown slugs offer Home/Projects recovery links.

- [ ] **Step 6: Commit**

```bash
git add src/components/CaseStudyHeader.tsx src/components/EvidencePanel.tsx src/pages/CaseStudyPage.tsx src/pages/CaseStudyPage.test.tsx src/pages/NotFound.tsx app/routes/case-study.tsx react-router.config.ts e2e/case-studies.spec.ts
git commit -m "feat: publish evidence-rich case studies [3.3.1]"
```

---

### Task 11 (3.4.1): Rebuild Search and Library as professional discovery tools

**Files:**

- Create: `src/components/SearchField.tsx`
- Create: `src/components/SearchResults.tsx`
- Create: `src/pages/Search.test.tsx`
- Create: `src/pages/Library.test.tsx`
- Modify: `src/pages/Search.tsx`
- Modify: `src/pages/Library.tsx`
- Modify: `app/routes/search.tsx`
- Modify: `app/routes/library.tsx`
- Create: `e2e/discovery.spec.ts`

**Interfaces:**

- Consumes: `searchPortfolio(query)`, collection selector, case-study map, professional categories.
- Produces: labelled search, deterministic result groups, accessible filters, and release discovery without saved/ownership fiction.

- [ ] **Step 1: Write failing search, filter, and accessibility tests**

Assert search has a visible label and name, does not autofocus on mobile, matches organization/skill/action/result/takeaway text, renders a clear empty state, and links every result to a stable route. Assert Library filtering and A–Z sort are keyboard operable and use professional labels.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/pages/Search.test.tsx src/pages/Library.test.tsx`  
Expected: FAIL because current search aut focuses, calls results “Songs,” and Library implies ownership.

- [ ] **Step 3: Implement normalized O(n) discovery**

Use the selector from Task 2; do not rebuild searchable strings during each render. Group results into Experience, Projects, Leadership, Achievements, and Skills. Use category chips as small signals only.

- [ ] **Step 4: Replace recent-search and ownership semantics**

Do not persist raw search terms. Rename “Your Library” to “Career Library,” “Songs” to “Proof tracks” or the relevant professional group, and “Playlists” to “Releases” with themed terminology secondary.

- [ ] **Step 5: Measure interaction cost and verify**

Add a unit benchmark over the current corpus that performs 1,000 searches and asserts median work remains below 50ms in the test environment without promising cross-device timing precision.

Run:

```bash
npm test -- src/pages/Search.test.tsx src/pages/Library.test.tsx src/content/selectors.test.ts
npm run test:e2e -- e2e/discovery.spec.ts
npm run lint
npm run type-check
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/SearchField.tsx src/components/SearchResults.tsx src/pages/Search.tsx src/pages/Search.test.tsx src/pages/Library.tsx src/pages/Library.test.tsx app/routes/search.tsx app/routes/library.tsx e2e/discovery.spec.ts src/content/selectors.test.ts
git commit -m "feat: make portfolio discovery recruiter-friendly [3.4.1]"
```

---

### Task 12 (4.1.1): Add route metadata, structured data, and privacy-safe analytics

**Files:**

- Create: `src/seo/meta.ts`
- Create: `src/seo/meta.test.ts`
- Create: `src/seo/structuredData.ts`
- Create: `src/seo/structuredData.test.ts`
- Create: `src/analytics/outcomes.ts`
- Create: `src/analytics/outcomes.test.ts`
- Create: `src/components/OutcomeLink.tsx`
- Modify: `app/root.tsx`
- Modify: `app/routes/*.tsx`
- Modify: `src/components/ContactActions.tsx`
- Modify: `src/pages/CaseStudyPage.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`

**Interfaces:**

- Consumes: candidate, route content, canonical site origin, and conversion controls.
- Produces: `buildRouteMeta`, `buildPersonJsonLd`, `buildCreativeWorkJsonLd`, and `trackOutcome(name, properties)`.

- [ ] **Step 1: Write failing metadata and privacy tests**

Assert every prerender path has unique title, description, canonical URL, and social image. Assert structured data omits unsupported awards/claims. Assert event payloads reject email, phone, raw search terms, URLs with query strings, and arbitrary strings.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/seo src/analytics`  
Expected: FAIL because the helpers do not exist.

- [ ] **Step 3: Implement typed metadata and JSON-LD**

Use discriminated route metadata inputs and output React Router meta descriptors. Generate `Person` for the profile and `CreativeWork` for case studies. Only include data present in the typed source model.

- [ ] **Step 4: Implement outcome-only analytics**

Install `@vercel/analytics`. Limit event names to:

```ts
export type OutcomeEvent =
  | "cv_download"
  | "email_open"
  | "linkedin_open"
  | "case_study_open"
  | "evidence_open"
  | "career_mix_complete";
```

Allow only route ID, case-study ID, evidence ID, and placement enums as properties. Never send raw search text or personal contact values.

- [ ] **Step 5: Add sitemap/robots and verify prerender output**

Generate or update sitemap entries from the same route list used by prerendering. Confirm canonical paths, no duplicate titles, and crawlable ordinary links.

- [ ] **Step 6: Run gates and commit**

```bash
npm test -- src/seo src/analytics src/components/ContactActions.test.tsx
npm run build
npm run test:e2e -- e2e/prerender.spec.ts
git add src/seo src/analytics src/components/OutcomeLink.tsx src/components/ContactActions.tsx src/pages/CaseStudyPage.tsx app package.json package-lock.json public/robots.txt public/sitemap.xml
git commit -m "feat: add searchable metadata and outcome analytics [4.1.1]"
```

---

### Task 13 (4.2.1): Enforce accessibility, responsive, coverage, link, and performance budgets

**Files:**

- Create: `e2e/recruiter-journey.spec.ts`
- Create: `e2e/career-mix.spec.ts`
- Create: `e2e/accessibility.spec.ts`
- Create: `e2e/responsive.spec.ts`
- Create: `e2e/performance.spec.ts`
- Create: `scripts/check-links.mjs`
- Create: `scripts/check-content.mjs`
- Create: `lighthouserc.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: all completed routes/components, `validatePortfolio`, prerender output, and production server.
- Produces: release-blocking WCAG, coverage, link, payload, Core Web Vitals proxy, and browser-flow gates.

- [ ] **Step 1: Add failing end-to-end acceptance tests**

Cover CV/email/LinkedIn from Home and a case study, complete Career Mix, direct-open every primary/case route, recover from 404, keyboard-navigate all controls, check mobile first viewport, test 320px/390px/tablet/desktop/400% zoom, and assert zero console errors.

- [ ] **Step 2: Add Axe coverage**

Scan Home, Artist, Search default/results/empty, Library, every case-study layout variant, open Career Mix, and 404. Fail on serious or critical violations and keep route-specific snapshots in failure output.

- [ ] **Step 3: Enforce 90% test coverage**

Configure Vitest coverage for all new and modified runtime modules with 90% statements, branches, functions, and lines. Exclude only generated route type files, static data literals, and test utilities; do not exclude components merely to make the threshold pass.

- [ ] **Step 4: Enforce transfer budgets**

Use Chromium CDP network events on a cold production navigation. Sum encoded response bytes by MIME type and assert:

```ts
expect(bytes.total).toBeLessThanOrEqual(1_048_576);
expect(bytes.images).toBeLessThanOrEqual(716_800);
expect(bytes.javascriptGzip).toBeLessThanOrEqual(153_600);
```

Also assert every image has non-zero rendered dimensions and no unexpected layout shift during initial load.

- [ ] **Step 5: Add Lighthouse and content/link gates**

Install `@lhci/cli`. Require mobile scores of at least 0.95 for Performance, Accessibility, Best Practices, and SEO, with LCP ≤2500ms and CLS ≤0.1. `check-content.mjs` exits non-zero on validation errors; `check-links.mjs` verifies internal prerender paths, résumé, mailto, LinkedIn, and evidence links without logging personal values.

- [ ] **Step 6: Wire every gate into CI**

Quality runs format/lint/type/content. Test runs unit coverage. Build runs production build and link validation. Browser runs all Playwright and Lighthouse checks. No job is marked optional.

- [ ] **Step 7: Fix every regression until the full gate passes**

Run:

```bash
npm run check
npm run test:e2e
npx lhci autorun
```

Expected: zero failures, zero serious/critical Axe issues, ≥90% target coverage, and all payload/Lighthouse budgets pass.

- [ ] **Step 8: Commit**

```bash
git add e2e scripts lighthouserc.json package.json package-lock.json vite.config.ts .github/workflows/ci.yml
git commit -m "test: enforce Darshify release budgets [4.2.1]"
```

---

### Task 14 (4.3.1): Validate the private preview and prepare atomic cutover

**Files:**

- Create: `docs/release/2026-08-31-preview-audit.md`
- Create: `docs/release/2026-08-31-manual-a11y.md`
- Create: `docs/release/2026-08-31-content-sources.md`
- Modify: `README.md`
- Modify: `.Codex-protocol/state.json`

**Interfaces:**

- Consumes: green CI, Vercel preview URL, target-role reviewer feedback, and all automated artifacts.
- Produces: signed preview audit, manual accessibility record, source register, release/rollback instructions, and cutover readiness decision.

- [ ] **Step 1: Deploy the feature branch to a private Vercel preview**

Record the immutable preview URL and source commit in the audit. Do not change the production alias.

- [ ] **Step 2: Repeat automated gates against the preview**

Run Playwright and Lighthouse with `PLAYWRIGHT_BASE_URL`/Lighthouse URL set to the preview. Record CI run URLs, scores, transfer totals, route count, and browser matrix.

- [ ] **Step 3: Complete the manual WCAG 2.2 AA audit**

Record keyboard-only navigation, VoiceOver headings/landmarks/control names/live regions, 200% text zoom, 400% browser zoom, contrast, 44px touch targets, reduced motion, and mobile orientation behavior. Every row must include pass/fail, evidence, and remediation commit where applicable.

- [ ] **Step 4: Complete the truth and link audit**

Map every quantitative claim to source, period, status, and route. Open every résumé/contact/evidence/social link. Confirm zero fabricated verification, listener, play, duration, ranking, follow, like, or audio semantics remain.

- [ ] **Step 5: Run the recruiter comprehension test**

Use at least five target-role reviewers. Record whether each can state target function plus one verified proof point in five seconds and find a relevant project, CV, and contact method within 30 seconds. Require at least 80% success on both measures.

- [ ] **Step 6: Document rollback and approve cutover**

Record current production deployment/commit as the rollback target. The cutover checklist requires all automated and manual gates, reviewer threshold, and content-source audit to pass. If any gate fails, keep production unchanged.

- [ ] **Step 7: Update documentation and commit**

```bash
git add docs/release README.md .Codex-protocol/state.json
git commit -m "docs: certify Darshify preview for release [4.3.1]"
```

- [ ] **Step 8: Perform the atomic production cutover after explicit approval**

Promote the verified preview deployment, run a production smoke test for Home, Artist, one case study, CV, contact, Career Mix, and 404, then record the production deployment and rollback deployment. If smoke fails, immediately restore the recorded rollback target.

---

## Self-Review Record

- **Spec coverage:** Every goal, non-goal, content rule, page, visual rule, Career Mix behavior, architecture decision, accessibility target, performance budget, success metric, and release rule maps to at least one task above.
- **Task boundaries:** Each task produces an independently reviewable, testable deliverable and declares the interfaces later tasks consume.
- **Type consistency:** `Portfolio`, `ProofPoint`, `CaseStudy`, `Artifact`, `CareerMixChapter`, `caseStudyBySlug`, `searchPortfolio`, `useCareerMix`, `ContactActions`, `EvidenceCover`, and `ProofWaveform` retain the same names across producer and consumer tasks.
- **Quality continuity:** Task 1 establishes gates; every later task runs affected tests plus lint, type-check, and build; Task 13 makes final coverage, accessibility, and performance thresholds release-blocking.
- **Sequential constraint:** Tasks execute in numeric order. Independent work is documented in the protocol dashboard but does not begin concurrently unless the user explicitly changes the execution policy.
