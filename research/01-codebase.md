# Codebase research: Darshify "Spotify immersion" + name-search SEO

**Sector:** make every page feel near-indistinguishable from the real Spotify app, and make searches for "Darshil Jain" / "Darshil" surface this site first (SEO + AEO + GEO).
**Scope:** Large. **Stack:** React Router 7 framework mode (SSR + static prerender) on Vite 8, React 19, Tailwind 4, Motion 13, TypeScript 6.
**Inspected:** branch `feature/spotify-immersion` at `3dfae91` (same commit as `origin/build/darshify`, the default branch), 2026-10-17.
**Previous version of this file:** the recruiter-first research written at `60fd7a2` (describes the pre-redesign app at `d340f31`); it remains in git history.

Every claim below cites `file:line`. `git show <sha>:<path>` retrieves anything marked "removed".

---

## 0. Decision-relevant summary

1. **The Spotify player was deliberately removed and the removal is guarded by tests.** The persistent player bar, scrubber, volume, shuffle/repeat, likes, queue panel, now-playing panel, mobile now-playing sheet, track context menu, hover play-number swap, card hover play buttons, keyboard shortcuts, Web Audio ambient sound, recent searches and the AI cover art all existed before `60fd7a2`. They were deleted in `a154bd1`, `fd6de35` and `517623c`. The best restore sources are `a154bd1^` and `fd6de35^`, because the Codex pass had already migrated those files to Motion 13 and the 44 px targets before deleting them (§4.3).
2. **What remains is a 60-second "silent Career Mix" with 3 chapters** (`src/career-mix/*`). The dock exists only after the user clicks "Start Career Mix" (`CareerMixDock.tsx:27`). It has no seek, volume, queue or tracks.
3. **Content is accurate but heavily hedged.** "self-reported" is shown on every proof. All 17 case-study results are framed as "The résumé reports…", "Listed … in the résumé" or "self-reported through the résumé". Three achievements are dated "Date not listed in résumé". There are also unit-formatting bugs: "4 position", "10 top percent", "50,000+ INR". Several résumé facts are missing from the site: "Paid" engagement, "IIHMR Saamarthya 5.0", "13th" championship, "0 → 80+ members in 10 months", "largest management fest", "A/B testing", the LOR link and the Janakpuri, Delhi location (§5).
4. **There is no photo of Darshil anywhere** (repo, git history or résumé). The Person JSON-LD image is a text-only SVG.
5. **SEO basics are good, but entity SEO is weak.** All 28 routes are prerendered with unique title, canonical, OG and Twitter tags, and the main content is in the static HTML. However:
   - the canonical origin is `wrapped-portfolio.vercel.app`, so the domain does not contain his name;
   - the Home page has **no JSON-LD**, and Person markup lives only on `/artist`;
   - only the Home and Artist titles contain his name (none of the 23 collection or case-study titles do);
   - there is no `WebSite`/`ProfilePage` graph, `alumniOf`, `award` or `alternateName`;
   - the résumé PDF's own metadata says **Title "Copy of Resume", Author "Harish jaiswal"**;
   - there is no `llms.txt`;
   - `/liked` and `/playlist/achievements` duplicate each other in the sitemap (§6).
6. **Quality gates are green and fast.** lint 4 s, type-check 3 s, 296 unit tests 10 s, coverage 11 s, format 2 s, build + 28-route prerender 2 s. The 90 % coverage gate is an **aggregate** over an explicit 51-file allowlist. Branch coverage, at 91.05 %, has only **about 6 branches of headroom**. Any new runtime file must be added to `vite.config.ts:29-65` or it goes unmeasured.
7. **About 15 unit and e2e tests encode the recruiter-first stance and must be rewritten.** Examples: no `plays`/`durationSec`/`monthlyListeners`, Volume control count 0, no play buttons on cards, no persisted recents, profile art must be a proof SVG. One test should be **kept**: the guard against a Spotify-logo facsimile in social cards (§3.7).
8. **Perf traps to fix before building a richer player:**
   - the Career Mix context re-renders every consumer 4×/s while playing;
   - the shell re-renders on every scroll event (TopBar tint);
   - the old player re-rendered at 60 fps through a `requestAnimationFrame` progress state.

---

## 1. Architecture map

### 1.1 Routes (`app/routes.ts:3-16`) and prerender

| Path                  | Route module                                                      | Page component                | Loader                                                                                                  | `meta` / JSON-LD                                                |
| --------------------- | ----------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `/`                   | `app/routes/home.tsx`                                             | `src/pages/Home.tsx`          | `{ initialGreeting: currentGreeting() }`, evaluated **at build time** during prerender (`home.tsx:6-8`) | `buildRouteMeta({kind:"home"})` (`home.tsx:10`), **no JSON-LD** |
| `/artist`             | `app/routes/artist.tsx`                                           | `src/pages/ArtistPage.tsx`    | none                                                                                                    | route meta + `Person` (`artist.tsx:7-10`)                       |
| `/search`             | `app/routes/search.tsx`                                           | `src/pages/Search.tsx`        | none                                                                                                    | route meta                                                      |
| `/library`            | `app/routes/library.tsx`                                          | `src/pages/Library.tsx`       | none                                                                                                    | route meta                                                      |
| `/playlist/:id`       | `app/routes/collection.tsx` (id `routes/collection-playlist`)     | `src/pages/PlaylistPage.tsx`  | `collectionById` or `data(null,{status:404})` (`collection.tsx:22-41`)                                  | per-collection meta (`:43-57`)                                  |
| `/liked`              | same module (id `routes/collection-liked`, `app/routes.ts:11-13`) | `src/pages/LikedSongs.tsx`    | static object                                                                                           | liked meta                                                      |
| `/case-studies/:slug` | `app/routes/case-study.tsx`                                       | `src/pages/CaseStudyPage.tsx` | `caseStudyBySlug` or 404 (`:14-17`)                                                                     | meta + `CreativeWork` (`:19-32`)                                |
| `*`                   | `app/routes/not-found.tsx`                                        | `src/pages/NotFound.tsx`      | 404 (`:10-12`)                                                                                          | `noindex, nofollow` (`src/seo/meta.ts:140-144`)                 |

- **Prerender list** = `canonicalRouteInventory` (`src/seo/meta.ts:37-49`). That is 5 fixed routes + 6 collections + 17 case studies = **28 documents**, wired in `react-router.config.ts:5,10` with `ssr: true` and `vercelPreset()`.
- The build writes `build/client/**/index.html` plus `.data` files for 28 routes. Every route has `routeDiscovery: { mode: "initial" }` (`react-router.config.ts:11`).
- `/playlist/achievements` and `/liked` render the same collection through two different pages, with two canonicals. **Both URLs are in the sitemap** (`public/sitemap.xml:7,12`). In-app links always use `/liked` (`Home.tsx:64-67`, `ReleaseCard.tsx:6-7`, `Library.tsx:20-21`).

### 1.2 Provider / shell tree

```
app/root.tsx  Layout (html/head/Meta/Links/ScrollRestoration/Scripts)  :50-67
  Root  :69-81
    ProductionAnalytics (Vercel <Analytics>, only on canonical or *.vercel.app)  :34-48
    CareerMixProvider  (src/career-mix/CareerMixContext.tsx:84-141)
      ToastProvider    (src/shell/Toast.tsx:9-32; nothing calls useToast)
        AppShell       (src/shell/AppShell.tsx:12-44)
          MotionProvider (LazyMotion domAnimation strict + MotionConfig reducedMotion="user")
          SkipLink
          Sidebar (md+, fixed w-56)   TopBar (sticky, scroll tint)   <main overflow-y-auto><Outlet/></main>
          RouteFocus (focus h1 + scroll main to top on pathname change)
          CareerMixDock (null unless open)
          BottomNav (md:hidden)
    HydrationMarker (sets html[data-hydrated])  :24-32
  ErrorBoundary (generic "Something went wrong")  :83-102
```

### 1.3 Directory responsibilities

| Path                               | Responsibility                                                                                                                                                                                                                  | Notes                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `app/`                             | Route modules: loaders, `meta`, 404s, root layout and error boundary                                                                                                                                                            | thin adapters over `src/pages`                                                  |
| `src/pages/`                       | Home, ArtistPage, PlaylistPage, LikedSongs, Search, Library, CaseStudyPage, NotFound                                                                                                                                            | page modules resolve content IDs at module load and `throw` if they are missing |
| `src/shell/`                       | AppShell, Sidebar, TopBar, BottomNav, MediaCard, Shelf, PlayButton, Art, Toast, RouteFocus, SkipLink                                                                                                                            | Spotify chrome                                                                  |
| `src/components/`                  | RecruiterHero, ContactActions, OutcomeLink, ProofTrackRow, ProofWaveform, EvidenceCover, EvidencePanel, CaseStudyHeader, ReleaseCard, SearchField, SearchResults                                                                | recruiter / evidence UI                                                         |
| `src/content/`                     | `types.ts`, `portfolio.ts` (single source of truth, 741 lines), `selectors.ts` (O(1) maps + search), `validate.ts` (referential/provenance validator), `waveform.ts` (`formatProofValue`, waveform data), `artifactFallback.ts` | typed static content, no CMS                                                    |
| `src/career-mix/`                  | `reducer.ts` (pure state machine), `CareerMixContext.tsx` (provider + `useCareerMix`), `CareerMixDock.tsx` (UI)                                                                                                                 | the only "player"                                                               |
| `src/motion/`                      | `MotionProvider.tsx`                                                                                                                                                                                                            | Motion 13, `m.*` components only (LazyMotion `strict`)                          |
| `src/lib/`                         | `useReducedMotion` (useSyncExternalStore, SSR-safe), `useLocalStorage` (hydration-safe; **only tests use it**), `greeting.ts`                                                                                                   |                                                                                 |
| `src/seo/`                         | `meta.ts` (route inventory, canonical origin, meta builder), `structuredData.ts` (Person, CreativeWork)                                                                                                                         |                                                                                 |
| `src/analytics/`                   | `outcomes.ts` (allowlisted Vercel custom events + URL redaction)                                                                                                                                                                |                                                                                 |
| `src/icons/icons.tsx`              | inline SVG icons                                                                                                                                                                                                                | 7 exports unused (§7)                                                           |
| `src/styles/`                      | `tokens.css` (CSS vars + Tailwind `@theme inline`), `base.css` (fonts, globals, focus, reduced-motion)                                                                                                                          |                                                                                 |
| `scripts/generate-social-cards.ts` | writes 28 SVG card sources to `scripts/generated-social-card-sources/`, then renders them with sharp to `public/social-cards/*.png` (1200×630)                                                                                  | run with `npm run generate:social-cards`; PNGs are committed                    |
| `public/`                          | `Darshil_Jain_Resume.pdf`, `artifacts/*.svg` (8 text-only cover cards, about 1.3 KB each), `social-cards/*.png` (28), `favicon.svg`, `og.png` (unreferenced), `robots.txt`, `sitemap.xml`                                       |                                                                                 |
| `e2e/`                             | 7 Playwright specs with axe, run against `react-router-serve` on :3000                                                                                                                                                          |                                                                                 |

### 1.4 Content model (`src/content/types.ts`)

- **Entities:**
  - `CandidateProfile` (:3-16);
  - `EvidenceSource` (1: the résumé);
  - `ProofPoint` (**19**, all `status: "self-reported"` via the `resumeProof` helper, `portfolio.ts:7-25`);
  - `Artifact` (2: the résumé PDF and `profile-square.svg`);
  - `CaseStudy` (**17**: r1-r3 experience, p1-p4 projects, l1 leadership, a1-a4 achievements, e1-e2 education, c1-c3 certifications);
  - `Collection` (6: experience, projects, skills, certs, achievements, education);
  - `CareerMixChapter` (3: Operate / Analyze / Lead, `portfolio.ts:721-740`).
- `EvidenceStatus = "verified" | "self-reported" | "redacted"` (`types.ts:1`). `validate.ts` rejects `verified` when the only source is the résumé (`content.test.ts:203`).
- **Selectors** (`selectors.ts:203-243`): `caseStudyById/BySlug`, `proofById`, `sourceById`, `artifactById`, `collectionById`, `caseStudyEvidenceById`, `relatedCaseStudies`, `searchPortfolio` (normalized substring + category aliases), `searchSkills`.
- **Presentation formatting:** `formatProofValue` (`waveform.ts:20-24`) concatenates `value` + `unit`. Every proof's display string comes from it.

### 1.5 Motion

- Motion 13 is used through `LazyMotion features={domAnimation} strict` (`MotionProvider.tsx:9`). Only `m.*` components work; using `motion.*` throws in strict mode.
- Reduced motion is honored three ways:
  - `MotionConfig reducedMotion="user" skipAnimations` (`:10`);
  - a CSS kill switch (`base.css:100-118`);
  - `[data-motion-transform]` transform reset (`base.css:115-122`).
- Current Motion uses:
  - CareerMixDock enter animation (`CareerMixDock.tsx:37-42`);
  - ProofWaveform path draw (`ProofWaveform.tsx:77-89`).
- `src/motion/motion.test.tsx` (441 lines) asserts the policy.

---

## 2. Tech stack (installed versions from `node_modules/*/package.json`)

| Package                          | Version |     | Package                      | Version |
| -------------------------------- | ------- | --- | ---------------------------- | ------- |
| react / react-dom                | 19.2.7  |     | vitest / @vitest/coverage-v8 | 4.1.11  |
| react-router / react-router-dom  | 7.18.3  |     | @testing-library/react       | 16.3.2  |
| @react-router/dev, /node, /serve | 7.18.3  |     | @testing-library/jest-dom    | 6.9.1   |
| @vercel/react-router             | 1.3.6   |     | jsdom                        | 29.1.1  |
| @vercel/analytics                | 2.0.1   |     | @playwright/test             | 1.62.1  |
| motion (+ framer-motion dep)     | 13.1.1  |     | @axe-core/playwright         | 4.13.0  |
| vite                             | 8.0.16  |     | eslint                       | 10.5.0  |
| @vitejs/plugin-react             | 6.0.2   |     | typescript-eslint            | 8.61.1  |
| tailwindcss / @tailwindcss/vite  | 4.3.1   |     | eslint-plugin-react-hooks    | 7.1.1   |
| typescript                       | 6.0.3   |     | prettier                     | 3.9.6   |
| isbot                            | 5.2.2   |     | sharp                        | 0.35.4  |
| @fontsource-variable/archivo     | 5.3.0   |     | @fontsource/ibm-plex-mono    | 5.3.0   |

- **Node:** local `v25.9.0` (npm 11.12.1). `.node-version` = `24` and CI uses Node 24 (`.github/workflows/ci.yml`).
- **Fonts:** Archivo Variable (UI) and IBM Plex Mono 500 (evidence/metadata), Latin subsets only, `font-display: swap`, not preloaded (`base.css:1-17`). Spotify's own faces (Spotify Mix / Circular) are proprietary.
- **Client JS (build output):**

  | Chunk                | Raw     | Gzip    | Contents                |
  | -------------------- | ------- | ------- | ----------------------- |
  | `entry.client`       | 186 KB  | 58.7 KB | client entry            |
  | `jsx-runtime`        | 130 KB  | 43 KB   | React DOM               |
  | `root`               | 52.7 KB | 19.3 KB | root route              |
  | `useReducedMotion-*` | 38.5 KB | 13.9 KB | Motion                  |
  | `meta-*`             | 22.5 KB | 6.3 KB  | portfolio content + SEO |
  | CSS                  | 39.5 KB | 8 KB    | styles                  |

---

## 3. Conventions, tests and quality gates

### 3.1 Naming and structure

- Components and files use PascalCase. Hooks use `useX`. Content IDs are short codes (`r1`, `p2`, `a3`, `c1`, `e1`, `l1`). Proof IDs are kebab-case (`figmenta-resumes`). Slugs are SEO-style (`figmenta-operations-intern`).
- Props are typed inline. Pages export named components. Route modules export `loader`, `meta` and a default component; ESLint allows only those names in `app/**` (`eslint.config.js` react-refresh rule).
- Styling is Tailwind utilities on top of semantic tokens:
  - colors: `--color-ink/panel/elevated/line/text/muted/signal` (`tokens.css:4-10`);
  - compatibility aliases: `bg`, `card`, `card-hi`, `accent`, `sub` (`tokens.css:60-65`);
  - type scale: `text-utility … text-hero-desktop` (`tokens.css:21-27,70-76`).
- Imports are mixed: 30 files import from `react-router-dom` and 15 from `react-router`.

### 3.2 State management

- **Global:** React context only.
  - `CareerMixProvider` uses `useReducer` over a pure reducer (`CareerMixContext.tsx:85`).
  - `ToastProvider` uses `useState` (unused).
- **Local:** `useState`/`useMemo` in Search (`Search.tsx:9-12`) and Library (`Library.tsx:63-79`).
- **Persistence:** nothing persists at runtime. `useLocalStorage` exists but no runtime code uses it. The e2e suite forbids persisting search queries (§3.7).
- **Derived data:** computed once at module load (maps in `selectors.ts:7-22`, search index `:132-186`).

### 3.3 Error handling

- **Fail-fast on content drift.** Pages resolve hard-coded content IDs inside module-level IIFEs and `throw` if any is missing. Examples: `Sidebar.tsx:8-17`, `RecruiterHero.tsx:15-56`, `ArtistPage.tsx:18-52`, `Home.tsx:17-26`, `LikedSongs.tsx:7-18`, `CaseStudyPage.tsx:21-30,59-61`.
- **404s:** handled with `data(null, {status: 404})` plus an in-route `NotFoundView` (`collection.tsx:33,61`, `case-study.tsx:16,36`). The root `ErrorBoundary` is generic (`root.tsx:83-102`).
- **Analytics never blocks navigation.** `OutcomeLink` swallows tracker errors (`OutcomeLink.tsx:40-47`). The tracker itself throws on non-allowlisted input (`outcomes.ts:73-107`) so that tests catch it.

### 3.4 How tests are written

- **Totals:** Vitest globals + jsdom + `@testing-library/jest-dom` (`src/test/setup.ts`). 35 files, 296 tests, co-located `*.test.ts(x)`.
- **Component tests** render with `MemoryRouter` + providers and stub `matchMedia`/`localStorage` using `vi.stubGlobal` (`src/pages/Home.test.tsx:16-43`). Queries are role-based (`getByRole("heading", {level: 1})`).
- **Content invariants** run through `validatePortfolio` (`src/content/content.test.ts`, 288 lines). Several tests start with "Regression:" comments that explain why they exist.
- **Node-environment tests** cover config and files (`// @vitest-environment node`, `src/test/coverage-scope.test.ts:1`). Examples: sitemap sync, social-card byte budget and hashes, SVG artifact text.
- **e2e** (Playwright + axe) covers:
  - "core content without JavaScript" checks of the prerendered HTML (`e2e/case-studies.spec.ts:48`, `e2e/prerender.spec.ts:183`);
  - a hydration-stability check (`e2e/prerender.spec.ts:261`);
  - keyboard and landmark checks (`e2e/shell-accessibility.spec.ts`).

### 3.5 The 90 % coverage gate (`vite.config.ts`)

**How the gate works:**

- `npm run test:coverage` sets `COVERAGE_SCOPE=redesign`.
- `coverage.include` becomes the explicit allowlist `cumulativeRedesignRuntime` (`vite.config.ts:29-65`), and thresholds are 90 for statements, branches, functions and lines (`:89-96`).
- Thresholds are **aggregate**: there is no `perFile`. That is why `app/routes/home.tsx` at 25 % lines and `artist.tsx` at 50 % pass today.
- Plain `npm test` enforces no threshold.

**Files in scope (51):**

- `app/root.tsx`, `app/routes/{artist,collection,case-study,home,not-found,library,search}.tsx`
- design-system list (`:7-15`): `src/lib/useReducedMotion.ts`, `src/motion/MotionProvider.tsx`, `src/shell/{AppShell,MediaCard,PlayButton,Sidebar,TopBar}.tsx`
- semantic-shell list (`:16-28`): `src/components/ContactActions.tsx`, `src/icons/icons.tsx`, `src/pages/{ArtistPage,Home,Library,LikedSongs,PlaylistPage,Search}.tsx`, `src/shell/{BottomNav,RouteFocus,SkipLink}.tsx`
- `src/career-mix/{CareerMixContext.tsx,CareerMixDock.tsx,reducer.ts}`
- `src/components/{EvidenceCover,CaseStudyHeader,EvidencePanel,OutcomeLink,ProofTrackRow,ProofWaveform,RecruiterHero,ReleaseCard,SearchField,SearchResults}.tsx`
- `src/content/{artifactFallback,portfolio,selectors,validate,waveform}.ts`
- `src/shell/{Art,Shelf}.tsx`, `src/pages/{CaseStudyPage,NotFound}.tsx`
- `src/analytics/outcomes.ts`, `src/seo/{meta,structuredData}.ts`

**Runtime files outside the scope:** `src/shell/Toast.tsx`, `src/lib/useLocalStorage.ts`, `src/lib/greeting.ts`, `app/routes.ts`, `scripts/generate-social-cards.ts`, and `src/content/types.ts` (types only).

**Regression lock:** `src/test/coverage-scope.test.ts:5-35,44-57` asserts that 29 specific modules stay in `include`.

**Current numbers and headroom:**

| Metric     | Covered / total | %         | Headroom over 90 % |
| ---------- | --------------- | --------- | ------------------ |
| Statements | 846 / 883       | 95.8      | about 51           |
| Branches   | 550 / 604       | **91.05** | **about 6**        |
| Functions  | 293 / 305       | 96.06     | about 18           |
| Lines      | 796 / 823       | 96.71     | about 55           |

**Weakest files:**

| File                                | Coverage gap                  |
| ----------------------------------- | ----------------------------- |
| `app/routes/home.tsx`               | 25 % lines                    |
| `app/routes/artist.tsx`             | 50 % lines                    |
| `src/icons/icons.tsx`               | 61 % functions (unused icons) |
| `EvidencePanel.tsx`                 | 64 % branches                 |
| `ArtistPage.tsx` / `LikedSongs.tsx` | 50 % branches                 |
| `PlaylistPage.tsx`                  | 57 % branches                 |

**Implication:** every new or modified runtime file (player store, new panels, new pages, `llms.txt` generator and so on) must be appended to `cumulativeRedesignRuntime`, ideally also to the regression list, and covered well. Otherwise it is either unmeasured or drags the branch metric under 90 %.

### 3.6 Commands run now (2026-10-17, this branch)

| Command                                       | Result                                                                                         | Wall time           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------- |
| `npm run lint` (`eslint .`)                   | pass, 0 problems                                                                               | 4 s                 |
| `npm run type-check` (`tsc -b`)               | pass                                                                                           | 3 s                 |
| `npm test` (`vitest run`)                     | **35 files / 296 tests pass**                                                                  | 10 s (vitest 9.3 s) |
| `npm run test:coverage`                       | pass (numbers above)                                                                           | 11 s                |
| `npm run format:check` (`prettier --check .`) | pass                                                                                           | 2 s                 |
| `npm run build` (`react-router build`)        | pass; client 363 ms, SSR 318 ms, 28 routes prerendered                                         | 2 s                 |
| `npm run test:e2e`                            | **skipped** per instructions; `pretest:e2e` runs the build, then `react-router-serve` on :3000 | n/a                 |

- **Build warnings:** 5 React Router v8 future-flag warnings: `v8_middleware`, `v8_splitRouteModules`, `v8_viteEnvironmentApi`, `v8_passThroughRequests`, `v8_trailingSlashAwareDataRequests`.
- **`npm run check`** chains format, lint, type-check, coverage and build.
- **CI** (`.github/workflows/ci.yml`) runs `quality` → `test` (coverage) → `build` → `browser` (Playwright chromium).

### 3.7 Tests that encode the recruiter-first stance (must change for this sector)

| Test                                                                                                                                                                    | What it forbids or requires                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/content.test.ts:76-81`                                                                                                                                     | content JSON may not contain `monthlyListeners`, `plays`, `durationSec` or `verifiedCandidate`                                                                                         |
| `e2e/baseline.spec.ts:19-37`                                                                                                                                            | a "silent" Career Mix with total 60000 ms; **`getByLabel("Volume")` count 0** (`:33`); status text "Operate. Playing."                                                                 |
| `e2e/recruiter-home.spec.ts:22-85`                                                                                                                                      | recruiter briefing and conversions above the fold; exactly 3 "Recruiter Essentials" articles; **no `/play/i` buttons in cards**; the text "Made for Recruiters" must not exist (`:84`) |
| `e2e/discovery.spec.ts:94-102`                                                                                                                                          | the query must not be persisted and `dx_recents` must not exist, which blocks restoring "Recent searches" as it was                                                                    |
| `e2e/discovery.spec.ts:3`                                                                                                                                               | the search field must not steal focus (the old Search used `autoFocus`)                                                                                                                |
| `src/content/artifact-assets.test.ts:26-46`                                                                                                                             | profile artwork must be an SVG whose text contains the canonical proof value, label, period, status and source. A photo would fail this test                                           |
| `src/seo/meta.test.ts:24-25,114-120`                                                                                                                                    | hard-coded **28** routes and 28 distinct social cards (< 2.5 MB total, `:121`)                                                                                                         |
| `src/seo/meta.test.ts:124-144`                                                                                                                                          | social cards must use `data-motif="proof-wave"` and must not combine a green circle with a three-curve mark. **Keep this.** It guards against a Spotify-logo facsimile                 |
| `src/seo/meta.test.ts:179-194`                                                                                                                                          | the checked-in sitemap and robots must match the inventory exactly                                                                                                                     |
| `src/seo/structuredData.test.ts:30`                                                                                                                                     | the phone number must not appear in JSON-LD                                                                                                                                            |
| `src/lib/hydration.test.tsx`, `e2e/prerender.spec.ts:261`                                                                                                               | timezone, localStorage and reduced motion may not change the hydrated tree. This matters for a visible "Good evening" greeting                                                         |
| Page tests (`Home.test.tsx`, `ArtistPage.test.tsx`, `portfolio-pages.test.tsx`, `Search.test.tsx`, `Library.test.tsx`, `CaseStudyPage.test.tsx`, `CareerMix*.test.tsx`) | assert current recruiter copy, headings and Career Mix labels (26 references to "Recruiter briefing" or "Career Mix" across page tests and e2e)                                        |

The previous spec's non-goals also forbade "generic AI artwork … or trademarked Spotify logo/assets" (`docs/superpowers/specs/2026-08-31-darshify-recruiter-first-redesign.md:31`). The prior owner chose to stay "Spotify-themed" but never a facsimile. A near-indistinguishable clone raises trade-dress and trademark questions: the name, the logo mark, the Circular/Spotify Mix fonts, the exact icons. Phase 2 should decide where the line is. A suggested baseline: keep the "Darshify" wordmark, original icons, no Spotify logo, and a "not affiliated with Spotify" note.

---

## 4. Overlap with the "feels like the real Spotify app" goal

### 4.1 What exists today

| Piece                                                  | File                                                     | Spotify fidelity today                                                                                                                                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3-pane shell (rounded panels on black, sidebar + main) | `AppShell.tsx:17-41`, `Sidebar.tsx:28-123`               | layout is right. The sidebar is fixed at `w-56` (`Sidebar.tsx:31`), cannot be resized or collapsed, and is labeled "Overview" / "Portfolio" (`:45,56`), not Home / Your Library                                                                                             |
| Sticky TopBar with back/forward and scroll tint        | `TopBar.tsx:16-57`                                       | tint is a hard-coded gradient per route (`:6-14`), not sampled from artwork. Back/forward are text glyphs `‹ ›`. The "D Darshil" chip is a non-interactive span (`:49-54`)                                                                                                  |
| Bottom nav (mobile)                                    | `BottomNav.tsx:7-24`                                     | Overview / Search / Portfolio labels                                                                                                                                                                                                                                        |
| Player                                                 | `CareerMixDock.tsx:22-133`                               | appears only after "Start Career Mix" (`:27` returns `null`). It shows chapter title, an evidence link, a non-interactive `<progress>` (`:68-78`) and prev / play / next / close. No artwork, seek, volume, queue, like or now-playing view. Fixed "x / 1:00" timer (`:65`) |
| PlayButton (green circle)                              | `PlayButton.tsx:3-29`                                    | used on Playlist and Liked headers to open the Career Mix (`PlaylistPage.tsx:53-57`)                                                                                                                                                                                        |
| MediaCard / Shelf                                      | `MediaCard.tsx:4-60`, `Shelf.tsx:4-48`                   | cards have no hover play button. Shelves render as a responsive **grid** (`Shelf.tsx:43`), not horizontal rows. Card art alt duplicates the title (`MediaCard.tsx:30-35`)                                                                                                   |
| Track-like rows                                        | `ProofTrackRow.tsx:5-76`                                 | large evidence cards with a static index. No hover play swap, duration or context menu                                                                                                                                                                                      |
| Playlist / Liked headers                               | `PlaylistPage.tsx:27-50`, `LikedSongs.tsx:25-47`         | flat `bg-elevated` header. No gradient from the cover and no "Darshil Jain • N songs, M min" line                                                                                                                                                                           |
| Proof Waveform                                         | `ProofWaveform.tsx:37-159`                               | original signature viz. Links are raw `<a href>` and reload the page (`:130-134`)                                                                                                                                                                                           |
| Covers                                                 | `Art.tsx`, `EvidenceCover.tsx`, `public/artifacts/*.svg` | typographic SVG cards (category / organization / value / "self-reported"). No imagery                                                                                                                                                                                       |
| Toast                                                  | `Toast.tsx`                                              | mounted, **never used** (`useToast` has no callers)                                                                                                                                                                                                                         |
| Search                                                 | `Search.tsx`, `SearchField.tsx`, `SearchResults.tsx`     | grouped results by category. Browse uses `ReleaseCard`s, not colored genre tiles                                                                                                                                                                                            |
| Library                                                | `Library.tsx:62-185`                                     | filter buttons + `<select>` sort + local search. Not the compact Spotify list                                                                                                                                                                                               |

### 4.2 Gap matrix against real Spotify

| Spotify pattern                                                                                        | Status                                                        | Where it lived / restore source                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Always-visible bottom player bar with preloaded track                                                  | **removed**                                                   | `PlayerBar` (`d340f31:src/shell/PlayerBar.tsx:10-85`; Motion-migrated version at `a154bd1^`). "Press play" nudge + preloaded track came from `388f7ed`  |
| Scrubbable progress with elapsed/total and `aria-valuetext`                                            | **removed**                                                   | `PlayerBar` range input (`d340f31` `:62-69`)                                                                                                            |
| Volume slider (persisted)                                                                              | **removed**                                                   | `PlayerBar` `:73-82` + `dx_vol` in `PlayerContext`                                                                                                      |
| Shuffle / repeat (off/all/one)                                                                         | **removed** (icons still exported, unused: `icons.tsx:40-62`) | `src/player/engine.ts` (seeded mulberry32 shuffle), `fd6de35^`                                                                                          |
| Like / heart + Liked Songs that grows                                                                  | **removed**                                                   | `toggleLike`/`dx_likes` in `PlayerContext`, union list in old `LikedSongs.tsx:10`                                                                       |
| Queue panel (Now playing / Next up, jump-to)                                                           | **removed**                                                   | `QueuePanel.tsx` (`d340f31:5-36`; `a154bd1^`)                                                                                                           |
| Now Playing right panel (art, title, details, "About the artist")                                      | **removed**                                                   | `NowPlayingPanel.tsx` (`d340f31:6-41`; `a154bd1^`)                                                                                                      |
| Mobile mini-player + full-screen now-playing sheet                                                     | **removed**                                                   | slide-up sheet in old `AppShell` (`d340f31:83-92`; Motion version at `a154bd1^`), added in `2a3b3f3`                                                    |
| Track table (# / Title / Plays / ⏱ header, hover number→play swap, current track in green)             | **removed**                                                   | `TrackRow.tsx` (`d340f31:33-60`), header row in old `PlaylistPage.tsx:38-40`, `fd6de35^`                                                                |
| Right-click context menu (Add to queue, Copy link, Go to artist) + toast                               | **removed**                                                   | `TrackRow.tsx` (`d340f31:68-78`), from `2a3b3f3`                                                                                                        |
| Expandable track detail                                                                                | **removed**                                                   | `TrackRow` (`388f7ed`)                                                                                                                                  |
| Card hover green play button                                                                           | **removed**                                                   | old `MediaCard.tsx` (`d340f31:14-21`)                                                                                                                   |
| Home greeting H1 + 2×3 quick-pick tiles + "Made for Recruiters / Your Top Hits / Jump back in" shelves | **removed** (greeting now `sr-only`, `RecruiterHero.tsx:74`)  | old `Home.tsx` (`d340f31:20-73`)                                                                                                                        |
| Artist hero banner + big name + monthly listeners + Follow + Popular + Discography                     | **removed**                                                   | old `ArtistPage.tsx` (`d340f31:21-49`). Note the fabricated `monthlyListeners: 98_400` and "✓ Verified Candidate" (`:25,27`)                            |
| Playlist header gradient + "Darshil Jain · N songs · total time"                                       | **removed**                                                   | old `PlaylistPage.tsx:22-30`                                                                                                                            |
| Search "Browse all" colored genre tiles + "Recent searches"                                            | **removed**                                                   | old `Search.tsx:45-66` (`ba5d3b3`), `genres` in old `library.ts:60-66`                                                                                  |
| Library sort menu (Recents / A–Z, menuitemradio)                                                       | replaced by `<select>`                                        | old `Library.tsx` (`d340f31:50-66`, from `6abfef2`)                                                                                                     |
| Keyboard shortcuts (Space play/pause, Shift+←/→ prev/next, ←/→ seek ±5 s)                              | **removed**                                                   | old `AppShell.tsx:36-48`                                                                                                                                |
| Ambient sound (Web Audio chord per item kind, opt-in, volume-linked)                                   | **removed**                                                   | `src/player/useAmbient.ts` + `CHORDS` (`d340f31:PlayerContext.tsx:29-36`), from `ba5d3b3`                                                               |
| AI cover art (playlists, liked, artist hero, avatar)                                                   | **removed**                                                   | 7 PNGs in `public/covers/` (`5da6abc`, deleted in `517623c`), **12.7 MB total**, 1024² (hero 1536×640). Abstract images, no likeness of Darshil         |
| Dynamic header colour sampled from artwork                                                             | partial (hard-coded per-route gradients, `TopBar.tsx:6-14`)   | never sampled                                                                                                                                           |
| Resizable / collapsible library sidebar                                                                | never built                                                   | —                                                                                                                                                       |
| Lyrics view                                                                                            | never built                                                   | —                                                                                                                                                       |
| Wrapped-style stories                                                                                  | **spec only**, never built                                    | `docs/superpowers/specs/2026-06-17-wrapped-portfolio-design.md:50-61` (10-slide deck), plan in `docs/superpowers/plans/2026-06-17-wrapped-portfolio.md` |
| Canvas (looping visual behind now playing), device picker, friend activity                             | never built                                                   | —                                                                                                                                                       |

### 4.3 Removal archaeology (where to restore from)

| Commit                | What it did                                                                                                                                                                                                                                                | Files                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `c5f929f` / `c9aff9e` | PlayerContext + Web Audio ambient; library data, engine, format (TDD)                                                                                                                                                                                      | `src/player/*`, `src/data/library.ts`, `src/lib/format.ts` |
| `393cf22` / `c735994` | shell primitives (TrackRow, MediaCard, Shelf, PlayButton, Toast); assembled shell, PlayerBar, Queue/NowPlaying panels, all pages                                                                                                                           | `src/shell/*`, `src/pages/*`                               |
| `0b24910`             | wired the Now-Playing panel to the player bar                                                                                                                                                                                                              | `AppShell`, `PlayerBar`                                    |
| `070f257`             | mobile bottom nav + responsive player bar                                                                                                                                                                                                                  | `BottomNav`, `PlayerBar`                                   |
| `388f7ed`             | expandable track detail, preloaded track + "Press play" nudge, favicon + `og.png`, a11y valuetext                                                                                                                                                          | `TrackRow`, `PlayerBar`, `PlayerContext`                   |
| `2a3b3f3`             | top-bar scroll tint, animated Queue/NowPlaying panels, track context menu, mobile now-playing sheet                                                                                                                                                        | `AppShell`, `TopBar`, `TrackRow`, `NowPlayingPanel`        |
| `ba5d3b3`             | per-kind ambient chords + recent searches + richer empty states                                                                                                                                                                                            | `useAmbient`, `PlayerContext`, `Search`                    |
| `6abfef2`             | functional "Show all" + Library sort menu                                                                                                                                                                                                                  | `Library`, `Shelf`, `Home`                                 |
| `5da6abc` / `d340f31` | AI cover art everywhere + quick-pick tile covers                                                                                                                                                                                                           | `public/covers/*.png`, `Art`, pages                        |
| **Deletions**         | `1646591` (index.html, App, main → framework mode); `66c9264` (`public/fonts/Display.ttf`); `517623c` (covers); `a154bd1` (PlayerBar, QueuePanel, NowPlayingPanel); `fd6de35` (library.ts, format.ts, PlayerContext, engine, useAmbient, TrackRow + tests) |                                                            |

**Best restore sources:** `git show a154bd1^:src/shell/{PlayerBar,QueuePanel,NowPlayingPanel,AppShell}.tsx` and `git show fd6de35^:src/{player/*,shell/TrackRow.tsx,data/library.ts,lib/format.ts}`. These versions are newer than `d340f31`: PlayerBar +110/−26, PlayerContext +131/−31, TrackRow +74/−41 lines. They already use `m`/`AnimatePresence` from `motion/react`, `MotionProvider`, `data-motion-transform`, 44 px targets and Prettier formatting.

**Restore caveats:**

- **Fabricated metrics.**
  - The old `Track` had invented `durationSec` and `plays` (e.g. Market Research `plays: 920000`), plus `monthlyListeners: 98_400` and "Verified Candidate" (`d340f31:src/data/library.ts:2,14,19-38`; `ArtistPage.tsx:25,27`).
  - `content.test.ts:76-81` bans these fields.
  - Phase 2 must decide between (a) clearly playful/fictional numbers, (b) numbers derived from real résumé metrics ("500+ résumés screened" as the "plays"), or (c) none.
- **60 fps re-render.** The old ticker drove `setProgress` from `requestAnimationFrame` (`d340f31:PlayerContext.tsx:82-100`), re-rendering every consumer at 60 fps. Prefer a CSS-animated progress bar, or a store with selective subscription (`useSyncExternalStore`).
- **Space shortcut bug.** The old Space handler skipped only INPUT, TEXTAREA and contentEditable (`d340f31:AppShell.tsx:13-16,40`). Space on a focused button or link would also toggle playback, so other interactive targets need the same guard.
- **Accessibility bugs in the old code:**
  - quick-pick tiles were `div onClick` (not keyboard-operable, `d340f31:Home.tsx:38-39`);
  - MediaCard nested a `<button>` inside a `<Link>` (`d340f31:MediaCard.tsx:8-21`);
  - Search used `autoFocus` (`Search.tsx:36`);
  - the "Link copied" toast fired even when the clipboard write failed (`TrackRow.tsx:74`).
- **SSR safety.** The AudioContext must be created lazily after a user gesture, on the client only. Under SSR, any `window` access must be guarded.
- **Cover sizes.** The PNGs need conversion (AVIF/WebP, about 30–80 KB each, with responsive variants) before re-adding.
- **Wrong LinkedIn URL.** The old data used `https://www.linkedin.com/in/darshil-jain08/` (`d340f31:library.ts:71`). The résumé link is `…/darshil-jain-611a3332b`, enforced by `content.test.ts:88-92`.

---

## 5. Content inventory

### 5.1 Identity and contact

| Field                               | Résumé (PDF, `pdftotext`)                                                                      | Site (`src/content/portfolio.ts`)                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Name                                | Darshil Jain                                                                                   | `candidate.name` (:421)                                                                                            |
| Phone                               | +91 9268264843                                                                                 | `candidate.phone` (:430). **Never rendered**, and deliberately excluded from JSON-LD (`structuredData.test.ts:30`) |
| Email                               | darshijain0809@gmail.com (mailto link)                                                         | `:429`, rendered as a mailto link in `ContactActions.tsx:53-63`                                                    |
| LinkedIn                            | `https://www.linkedin.com/in/darshil-jain-611a3332b` (link annotation)                         | `:431` (matches)                                                                                                   |
| "Portfolio" link                    | Google Drive folder `https://drive.google.com/drive/folders/1TaO_Ggtc4JIu13Yt7YhrM8I91NtYLlkM` | not on site. The résumé does not link to this website                                                              |
| LOR link (on the MJ Marketing line) | Google Drive file `https://drive.google.com/file/d/1BeJ0wgzNu1sNGpR0O2BXYtCBamCOrne4/view`     | **missing** from the site                                                                                          |
| Headline / summary                  | (none in résumé)                                                                               | "Business, strategy, and operations undergraduate"; summary "…with résumé-listed experience…" (:422-424)           |
| Location                            | only via college: "Janakpuri, Delhi"                                                           | **missing**                                                                                                        |
| Photo                               | none (the PDF holds 3 tiny icon images: 16×31, 30×22, 33×33)                                   | **none** in repo or git history (§5.5)                                                                             |
| PDF metadata                        | **Title "Copy of Resume", Author "Harish jaiswal"**, Creator Word 2013, 1 page A4, 255 KB      | served at `/Darshil_Jain_Resume.pdf` and indexable                                                                 |

### 5.2 Fact-by-fact comparison

| Résumé fact                                                                                                                                                                                                                                                                                                                             | Site entry                                                                           | Discrepancy / omission                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| BBA (B&I) 2024–27, Maharaja Surajmal Institute, GGSIPU, Janakpuri, Delhi, **9.39 CGPA**                                                                                                                                                                                                                                                 | `e1` (:328-344), proof `bba-cgpa` (:611-619)                                         | location omitted                                                                                                                         |
| XII 2024, Lovely Public Sr. Sec. School, Priyadarshini Vihar, **88 %**                                                                                                                                                                                                                                                                  | `e2` (:345-361), `class-xii-percentage`                                              | ok                                                                                                                                       |
| Figmenta, Operations Intern, Jan–Feb 2026: Notion+Excel dashboard, **35+ projects, 15+ members** (Asia team); **500+ résumés screened, 100+ shortlisted, 5+ hires** onboarded; hiring workflows, reusable onboarding decks                                                                                                              | `r1` (:39-72), 5 proofs (:458-502)                                                   | complete; result hedged (:56)                                                                                                            |
| PSR Compliance, Operations Intern, June–Aug 2025: **70+ clients** during team transition, coordinated with leadership, mentored interns; compliance consulting, upsell, renewals, service expansion → retention and monetization                                                                                                        | `r2` (:73-99), `psr-clients` (:503-511)                                              | "Drove customer and revenue outcomes" softened to "supported commercial outcomes"                                                        |
| MJ Marketing Consultancy (résumé typo "Markeing"), Human Resource Intern, Mar–Jun 2025, **LOR**: **500+ profiles, 100+ interviews, 300+ assessments**; funnel efficiency, faster hiring decisions                                                                                                                                       | `r3` (:100-122), 3 proofs (:512-538)                                                 | LOR link missing; "faster hiring decisions" dropped                                                                                      |
| **Paid** Strategy Consulting Engagement, ZautoAI (team), Nov–Dec 2025: AI healthcare startup; market + competitive analysis; GTM, pricing, positioning; presented to founder; startup became **finalist at IIHMR Saamarthya 5.0**                                                                                                       | `p1` (:123-150) "ZautoAI Strategy Consulting Engagement"                             | **"Paid" and "IIHMR Saamarthya 5.0" dropped** ("a competition finalist", :140); no proof                                                 |
| Consulting & Analytics Capstone, IIT Guwahati C&A Club, **Top 10 %**, Dec 2025–Jan 2026: telemedicine no-shows; phased product+process intervention; onboarding, nudges, **A/B testing**                                                                                                                                                | `p2` (:151-173), `iitg-participant-percentile` (:539-547)                            | "A/B testing" → "experimentation framework"; "Top 10 %" → "upper participant cohort" (:168, :322); proof renders **"10 top percent"**    |
| Haldiram's International Expansion Strategy (team), Apr–May 2025: tariffs, supply chain, localization; **publication-ready business case**                                                                                                                                                                                              | `p3` (:174-196)                                                                      | ok (organization shown as "Academic team project")                                                                                       |
| Zomato Metrics & Trends Dashboard (individual), Sep–Oct 2024: Looker Studio, **5+ metrics**                                                                                                                                                                                                                                             | `p4` (:197-219), `zomato-metrics`                                                    | ok                                                                                                                                       |
| Founder & President, Igniters Club (Powered by Unstop), Sep 2025–May 2026: **0 → 80+ members within 10 months**, **17-member** leadership across **4 departments**; led **Converge 2026, the institute's largest management fest**, **1,000+ participants**, hosted **industry leaders and startup founders**, **₹50,000+** sponsorship | `l1` (:220-252), 5 proofs (:557-601)                                                 | "0 →" growth framing, "10 months", "largest management fest", "industry leaders and startup founders" dropped; renders **"50,000+ INR"** |
| Finalist, **13th** National Business Plan Championship, IIM Bangalore × MakeIntern                                                                                                                                                                                                                                                      | `a1` (:253-271)                                                                      | "13th" dropped; period **"Date not listed in résumé"** (:259)                                                                            |
| **4th Position**, Product Decode, IIM Calcutta                                                                                                                                                                                                                                                                                          | `a2` (:272-289), `product-decode-rank` (:602-610)                                    | renders **"4 position"**; period "Date not listed…" (:278, :608)                                                                         |
| Top 10 %, IIT-G Winter Consulting Program                                                                                                                                                                                                                                                                                               | `a4` (:308-327)                                                                      | same program also appears as `p2` and `c2` (3 entries share one proof)                                                                   |
| Winner, BPlan Showdown Business Plan Competition                                                                                                                                                                                                                                                                                        | `a3` (:290-307)                                                                      | period "Date not listed…" (:296)                                                                                                         |
| Skills (12): Market Research, Competitive Analysis, Strategic Analysis, Business Development, Stakeholder Management, Project Management, Product Analysis, Process Optimization, Microsoft Excel, Google Sheets, Canva, Notion                                                                                                         | `candidate.skills` (:433-446)                                                        | exact match (résumé typo "Strategic Analysis)")                                                                                          |
| Certifications: Global Entrepreneurship Bootcamp – Hult Prize IIT Bombay **2026**; Winter Consulting Program **2025**; Business Intelligence & Data Analysis – IIM Bangalore **2024**                                                                                                                                                   | `c1` (:362-379), `c2` (:380-397, issuer inferred as IIT-G C&A Club), `c3` (:398-416) | results say "no separate certificate is stored in the repository" (:374,392,411)                                                         |

### 5.3 Copy that reads badly in a Spotify metaphor

- **Dates.** `period: "Date not listed in résumé"` (`portfolio.ts:259,278,296,608`) would show as a release date.
- **"self-reported" status on every proof.**
  - Source: `portfolio.ts:22`, the source note at `:454`, and baked into `public/artifacts/profile-square.svg:14`.
  - Rendered in `RecruiterHero.tsx:104`, `ProofTrackRow.tsx:64`, `CaseStudyHeader.tsx:64`, `CaseStudyPage.tsx:111` ("Verification: self-reported"), `ArtistPage.tsx:124` and `ProofWaveform.tsx:148-150`.
  - `EvidencePanel.tsx:16-24` adds "has not been independently verified".
  - The prerendered `/` HTML contains "self-reported" 12×; `/artist` contains it 17×.
- **Hedged results.**
  - "The résumé reports…" / "according to the résumé" / "Listed as … in the résumé": `portfolio.ts:56,90,117,140,168,191,214,237,266,284,302,322,339,356`.
  - "Completion is self-reported through the résumé…": `:374,392,411`.
  - "Résumé-listed …" takeaways: `:262,281,298,317,370,388,407`.
- **Recruiter-speak labels.**
  - "Recruiter briefing" (`RecruiterHero.tsx:76`, `meta.ts:57-58`, social card `home.png`)
  - "Recruiter Essentials" (`Home.tsx:36`)
  - "Recruiter takeaway" (`CaseStudyHeader.tsx:39`)
  - "Priority evidence ordered for a fast recruiter review." (`ArtistPage.tsx:147`)
  - "Candidate profile" (`Sidebar.tsx:72`)
  - "Overview" / "Portfolio" navigation (`Sidebar.tsx:45,56`, `BottomNav.tsx:14,20`)
- **Disclaimers.**
  - "Peak height is not popularity or ranking." (`ArtistPage.tsx:166-167`, `ProofWaveform.tsx:66-67`)
  - "Current availability is not stated in the candidate-provided résumé." (`ArtistPage.tsx:245-249`)
  - "Spotify-style releases remain a secondary wayfinding cue." (`Library.tsx:88-92`)
  - "résumé-listed recognition items" (`LikedSongs.tsx:44`)
- **Unit grammar** from `formatProofValue` (`waveform.ts:20-24`): "4 position", "10 top percent", "50,000+ INR", "9.39 CGPA", "17 members", "4 departments".

### 5.4 Site-only content (editorial, not in résumé)

- Headline and summary (`portfolio.ts:422-424`).
- All `recruiterTakeaway` / `situation` / `actions` phrasing.
- Collection themed labels: "Career EP", "Case-study LP", "Evidence mix", "Credential EP", "Recognition EP", "Academic EP" (`:658-719`).
- Career Mix chapters (`:721-740`).
- The pre-redesign tagline "Strategy & Operations · BBA (B&I) · CGPA 9.39" and the about text ("Three internships, four consulting/analytics projects, founder of an 80+ member club…", `d340f31:src/data/library.ts:13-15`) are good Spotify-bio copy to reconsider.

### 5.5 Imagery

- **No real photo of Darshil exists** in the working tree, git history or the résumé PDF.
- `public/artifacts/*.svg` are 8 typographic cards. `profile-square.svg` is text: "EVIDENCE PORTFOLIO / Darshil / Jain / 500+ résumés / … / self-reported".
- The removed AI covers are abstract: `avatar.png` is a green/gold emblem, `artist-hero.png` a green light-wave field.
- `public/og.png` (unreferenced) is the old "DARSHIFY · Darshil Jain · Press play on a career" card.
- A real headshot needs owner input. It would also unlock better Person/ProfilePage image markup and a Spotify-style artist hero. It requires changing `artifact-assets.test.ts:26-46` and the `Art` dimension map (`Art.tsx:1-10`).

---

## 6. Integration surface

### 6.1 SEO layer

- **Canonical origin:** `CANONICAL_SITE_ORIGIN = "https://wrapped-portfolio.vercel.app"` (`src/seo/meta.ts:5-6`). It is also hard-coded in `public/robots.txt:4`, `public/sitemap.xml`, the tests (`meta.test.ts:179-194`, `e2e/prerender.spec.ts:171-180`) and the analytics host check (`outcomes.ts:129,170-172`).
- **`buildRouteMeta(input)`** (`meta.ts:114-138`) returns:
  - `title`, `description` and the canonical `<link>`;
  - `og:title`, `og:description`, `og:url`, `og:type` (`website`, or `article` for case studies), `og:image` + type, width, height and alt;
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` + alt.

  Each route's `meta` export calls it.

- **Titles:** fixed in `meta.ts:55-79`; collections use `"<Title> evidence | Darshify"` (`:93`) and case studies use `"<Title> | Darshify"` (`:103`). Only Home ("Darshil Jain — Business, strategy & operations | Darshify") and Artist ("Darshil Jain professional profile | Darshify") include the name.
- **JSON-LD** is attached as a `{ "script:ld+json": object }` meta descriptor (`artist.tsx:9`, `case-study.tsx:28-30`). React Router renders it into `<head>`.
  - `buildPersonJsonLd` (`structuredData.ts:5-24`) has `@id …/artist#person`, name, description, jobTitle (the headline), url, image (`profile-square.svg`), `sameAs: [LinkedIn]` and `knowsAbout: skills`.
  - `buildCreativeWorkJsonLd` (`:26-47`) has name, takeaway description, `genre: kind`, `temporalCoverage: period`, keywords and a creator → person reference.
- **Social cards:** `scripts/generate-social-cards.ts` builds SVG then PNG (sharp) for each of the 28 inventory routes. Changing any title, adding a route, or removing one requires re-running `npm run generate:social-cards` and updating the hard-coded 28s in tests.
- **Sitemap and robots** are static files kept in sync by tests. Robots is `Allow: /` + Sitemap, so AI crawlers are allowed. The sitemap has no `lastmod`.

### 6.2 Prerendered HTML (checked in `build/client` after `npm run build`)

| Route                                      | Bytes  | H1 in static HTML                   | JSON-LD      |
| ------------------------------------------ | ------ | ----------------------------------- | ------------ |
| `/`                                        | 34,464 | "Darshil Jain"                      | **none**     |
| `/artist`                                  | 46,531 | "Darshil Jain"                      | Person       |
| `/search`                                  | 25,238 | "Search portfolio"                  | none         |
| `/library`                                 | 27,848 | "Career Library"                    | none         |
| `/liked`                                   | 26,208 | "Selected achievements"             | none         |
| `/playlist/experience`                     | 24,717 | "Experience"                        | none         |
| `/case-studies/figmenta-operations-intern` | 33,000 | "Operations Internship at Figmenta" | CreativeWork |

- **Main content is server-rendered** into static HTML on all 28 routes (good for Googlebot and LLM crawlers that do not run JS).
- `<head>` includes a `preload` of `/artifacts/profile-square.svg` (`fetchPriority=high`), the theme colour and a single `rel=icon` SVG.
- It has **no** `og:site_name`, `og:locale`, `profile:*`, `twitter:creator`, `apple-touch-icon`, web manifest, PNG or ICO favicon, or `meta author`.
- The Home loader's greeting is computed at **build time**. This build says "Good morning". On Vercel it will reflect the build server's clock. It is `sr-only` today.

### 6.3 SEO / AEO / GEO gaps (for "Darshil Jain" / "Darshil")

1. **Domain.** The name is not in the domain (`wrapped-portfolio.vercel.app`). A custom domain (e.g. `darshiljain.com` / `.in`) with a 301 from vercel.app is the biggest single lever. It touches `meta.ts:5-6`, robots, sitemap, the tests and the analytics host check.
2. **Home has no structured data.**
   - Add a `@graph` on `/` with:
     - `WebSite` (name "Darshify", alternateName "Darshil Jain");
     - `ProfilePage` (mainEntity → Person);
     - an enriched `Person`: `givenName`, `familyName`, `alternateName: ["Darshil"]`, `alumniOf` (Maharaja Surajmal Institute / GGSIPU; Lovely Public School), `address` (Delhi, IN), `award` (the 4 competition results), `hasCredential` (3 certifications), `hasOccupation` / `affiliation` (Figmenta, PSR Compliance, MJ Marketing Consultancy, Igniters Club), `email`, `knowsAbout`, `image` (needs a real photo), and `sameAs` (LinkedIn plus any other real profiles, owner to supply).
   - Keep one `@id` for the Person, reused across pages.
3. **Titles and descriptions.** Put "Darshil Jain" in every title and description (e.g. "Operations Intern at Figmenta — Darshil Jain | Darshify"). Use `og:type=profile` with `profile:first_name` / `profile:last_name` on `/` and `/artist`.
4. **Résumé PDF.** Fix the metadata Title ("Darshil Jain — Résumé") and Author ("Darshil Jain"). Ideally change the résumé's "Portfolio" link from the Drive folder to the site domain (a consistent backlink and entity signal).
5. **Duplicate URL.** `/liked` vs `/playlist/achievements`: canonicalize one, drop the other from the sitemap. Also consider dropping `/search` and `/library` from the sitemap and adding `lastmod`.
6. **AEO / GEO.**
   - Add `/llms.txt` (and optionally `/llms-full.txt`) with a factual bio and links.
   - Add an unhedged, entity-dense "About Darshil Jain" paragraph in static HTML on `/` and `/artist` (college, city, roles with dates, numbers).
   - Consider a short Q&A block ("Who is Darshil Jain?") with `FAQPage` markup.
   - The current hedged copy ("self-reported", "The résumé reports…") would be repeated verbatim by answer engines.
7. **Icons.** Add PNG favicons (48/192/512), `apple-touch-icon.png` and `site.webmanifest`. `favicon.svg` is a green circle + play triangle.
8. **Images.** No raster profile image means nothing can show in image results or a knowledge panel for the name.

### 6.4 Analytics (`src/analytics/outcomes.ts`)

- **Events:** `trackOutcome(name, props)` (`:174-179`). Events are allowlisted (`:11-17,41-48`): `cv_download`, `email_open`, `linkedin_open`, `case_study_open`, `evidence_open`, `career_mix_complete`.
- **Properties:** limited to `routeId | caseStudyId | evidenceId | placement`, validated against the inventory and content IDs (`:49-71,73-107`). Placements are a closed set (`:19-27`).
- **Adding events** (e.g. `track_play`, `queue_add`, `like`, `share`) requires extending the unions, sets and `outcomes.test.ts`.
- **Mounting:** Vercel `<Analytics>` is mounted only when the hostname is the canonical host or `*.vercel.app` (`root.tsx:34-48`). `beforeSend: redactAnalyticsEvent` rewrites URLs to canonical paths and drops anything outside the inventory (`:181-209`).
- **Domain change:** a new domain must update `shouldEnableAnalytics` (`:170-172`).

### 6.5 Career Mix API: the seam a richer player would extend

```ts
useCareerMix(): {                                   // CareerMixContext.tsx:76-82
  open(trigger?: HTMLElement | null): void          // OPEN → playing from chapter 0; remembers trigger (:108-111)
  toggle(): void; next(): void; previous(): void
  close(): void                                     // CLOSE + restores focus to trigger (:115-120)
  state: { status: "closed"|"paused"|"playing"|"complete"; chapterIndex: number; elapsedMs: number }
  activeChapter: { id; title; takeaway; durationMs; evidence: { label; href; caseStudyTitle } }
  progressRatio: number
}
```

- **Reducer.** Pure and fully tested: `careerMixReducer` (`reducer.ts:44-109`), actions `OPEN | TOGGLE | PREVIOUS | NEXT | TICK | CLOSE` (`:14-20`), fixed `CAREER_MIX_TOTAL_MS = 60_000` (`:3`), chapters split evenly (`:28-42`).
- **Chapters** are derived at module load from `portfolio.careerMixChapters`. Each resolves the first linked case study that has proofs (`CareerMixContext.tsx:48-71`).
- **Clock:** `setInterval` dispatches `TICK` every 250 ms (`:89-96`). Completion fires `career_mix_complete` once (`:98-106`).
- **Consumers:** `Home.tsx:29`, `ArtistPage.tsx:58`, `PlaylistPage.tsx:11` and `LikedSongs.tsx:21` use only `open`. `CareerMixDock.tsx:24-25` uses everything.
- **Perf issue:** one context value carries `state`, so **all consumers re-render 4×/s while playing** (`:122-134`).
- **Extension path:**
  - Split into an actions context and a state store (or `useSyncExternalStore`).
  - Generalize the reducer to queue semantics: `PLAY_CONTEXT(ids, index)`, `SEEK(ms)`, `ENQUEUE`, `SET_VOLUME`, `TOGGLE_SHUFFLE`, `CYCLE_REPEAT`, `TOGGLE_LIKE`. The old `engine.ts` (`nextIndex` / `prevIndex` / `shuffleOrder`) drops straight in.
  - Map "tracks" to the 17 case studies (or 19 proofs) with a deterministic duration rule.
  - Keep the Career Mix as a "This Is Darshil" mix / radio inside it.

---

## 7. Technical debt in adjacent areas

1. **Inner scroll container instead of window scroll.**
   - The cause: `body { overflow: hidden }` (`base.css:43`), an `h-screen` shell (`AppShell.tsx:21`) and `<main class="overflow-y-auto">` (`:26-31`).
   - The effects:
     - React Router `<ScrollRestoration>` (`root.tsx:62`) is inert;
     - `RouteFocus` scrolls `main` to top on _every_ pathname change, including Back/Forward (`RouteFocus.tsx:12-24`), so scroll position is lost;
     - the iOS/Android URL bar never collapses;
     - `100vh` clips under mobile browser chrome (needs `dvh`);
     - `html { scroll-behavior: smooth }` (`base.css:32-34`) does nothing;
     - Page Up/Down and Space scrolling work only when `main` has focus.
   - SEO impact is small (content is in HTML), but it hurts mobile UX and CWV.
2. **Scroll handler re-renders the shell.** `onScroll={setScrollY}` (`AppShell.tsx:29`) re-renders AppShell, Sidebar, TopBar, Dock and BottomNav on every scroll event, just to compute the TopBar tint (`TopBar.tsx:20`). Use a CSS scroll-driven animation, a rAF-throttled CSS variable or an IntersectionObserver sentinel.
3. **Career Mix context churn** (`CareerMixContext.tsx:89-96,122-134`), see §6.5.
4. **Hard-coded colours outside tokens:**
   - `TopBar.tsx:11-12,28` (`#0d0d12`), `Sidebar.tsx:67`, `CareerMixDock.tsx:43` (`bg-[#181818]`);
   - radial `rgba(30,215,96,…)` in `RecruiterHero.tsx:70` and `ArtistPage.tsx:66,254`;
   - collection gradients stored in content (`portfolio.ts:666-717`);
   - nothing derives colours from artwork.
5. **Boilerplate README** ("React + TypeScript + Vite" template, `README.md`). There are no project docs.
6. **Dead assets:**
   - `src/assets/hero.png` (343×361) and `src/assets/vite.svg` are unreferenced;
   - `public/og.png` is unreferenced (replaced by social cards);
   - `public/artifacts/profile-wide.svg` is referenced only by tests and the `Art` dimension map.
7. **Committed tool output:** `.vite/deps/_metadata.json` + `package.json` are tracked (`.gitignore` lacks `.vite/`). `.superpowers/sdd/.../task-11-report.md` is tracked although `.superpowers/` is ignored.
8. **Unused runtime code:**
   - `ToastProvider` is mounted (`root.tsx:74`) but `useToast` has no callers (`Toast.tsx:6`).
   - The toast stack has no `role="status"`/`aria-live` (`Toast.tsx:19-28`) and uses a module-global id and an inline `<style>`.
   - `useLocalStorage` is test-only.
   - 7 icons are unused (`icons.tsx:40,51,63,73,93,98,109`), which drags `icons.tsx` to 61 % function coverage.
9. **Router imports:** `react-router-dom` is redundant with `react-router` v7 (30 vs 15 importing files). There are also 5 v8 future-flag warnings at build.
10. **CI trigger gap:** `pull_request: branches: [main]` (`ci.yml:3-7`), but the integration/default branch is `build/darshify` (`origin/HEAD`). PRs into it get CI only through the `feature/**` push trigger.
11. **Node mismatch:** local 25.9 vs `.node-version` / CI 24.
12. **`formatProofValue` unit grammar** (`waveform.ts:20-24`). It needs per-proof display overrides (e.g. "4th", "Top 10 %", "₹50,000+").
13. **Duplicate route** `/liked` vs `/playlist/achievements` (§1.1, §6.3).
14. **Hard-coded "Back to Projects"** link on all 17 case studies (`CaseStudyPage.tsx:192-197`), including experience, education and achievements.
15. **Full page reloads from ProofWaveform:** internal links use `<a href>` instead of `<Link>` (`ProofWaveform.tsx:130-134`). This resets client state, including the Career Mix.
16. **Accessibility in code:**
    - card image `alt={title}` duplicates the link text (`MediaCard.tsx:30-35`);
    - Forward is always enabled (`TopBar.tsx:37-43`);
    - the brand SVG is not `aria-hidden` (`Sidebar.tsx:37-39`);
    - `<aside role="region">` is redundant, and `<progress>` duplicates `aria-value*` (`CareerMixDock.tsx:37-39,68-78`);
    - a global 44 px min block/inline size applies to _every_ `a`/`button`, including inline text links (`base.css:54-57`). This conflicts with Spotify's dense rows and inline artist links. Scope it to `.interactive-target` or `@media (pointer: coarse)`.
17. **UI coupled to content IDs:** pages pick content by literal IDs ("r1", "p2", "a2", "figmenta-projects", …) in `Home.tsx:11-15`, `ArtistPage.tsx:18-46` and `RecruiterHero.tsx:30-34`. Curation belongs in content (e.g. `featured`, `order` fields).
18. **Triplicated content:** the IIT-G Winter Consulting Program appears as project `p2`, achievement `a4` and certification `c2`, all citing one proof.
19. **Generated artifacts must be regenerated and committed by hand** (social cards, sitemap). Tests hard-code the count 28.
20. **Fonts:** Latin-only subsets, no preload. The Archivo + IBM Plex Mono pairing reads "editorial", not "Spotify".

---

## 8. Seams for this sector

- **Player.**
  - Reintroduce a `src/player/` store (reducer + `useSyncExternalStore`). Start from `fd6de35^:src/player/*` and `a154bd1^:src/shell/{PlayerBar,QueuePanel,NowPlayingPanel}.tsx`.
  - Fold the Career Mix in as a curated mix.
  - Keep the bar mounted and pre-loaded with a track.
  - Drive progress with CSS or a throttled clock.
  - Restore keyboard shortcuts with an interactive-element guard.
- **Pages.** Restore the Spotify layouts:
  - Home: greeting, quick picks, horizontal shelves;
  - Artist: hero, Popular, Discography, About;
  - Playlist: gradient header, track table;
  - Search: browse tiles;
  - Library: compact list.

  Keep the existing SSR-rendered semantic content so the SEO value stays.

- **Content.**
  - Add the missing résumé facts.
  - Replace hedges with confident, accurate copy.
  - Fix unit display.
  - Drop "Date not listed" (make `period` optional).
  - Add curation fields.
  - Decide the policy on playful metrics (plays, durations).
- **SEO.**
  - Custom domain.
  - JSON-LD graph on `/`.
  - The name in all titles.
  - Résumé PDF metadata.
  - `llms.txt`.
  - Sitemap dedupe + `lastmod`.
  - Raster icons.
  - A real photo (owner input).
- **Tests.**
  - Rewrite the §3.7 list.
  - Keep the facsimile guard.
  - Add every new runtime file to `vite.config.ts:29-65` and to `coverage-scope.test.ts`.
  - Watch the branch headroom (about 6).
