# Codebase research — Darshify recruiter-portfolio redesign

**Scope:** Large redesign, with the Spotify/music-streaming theme preserved as a non-negotiable constraint.

**Repository state inspected:** branch `build/darshify`, commit `d340f31` (`feat: cover art in Home quick-pick tiles`). This report describes the current codebase and migration seams; it does not score the design or prescribe a final visual direction.

## Executive summary

Darshify is a small, client-only React application that translates Darshil Jain's résumé into streaming-app vocabulary. It has a clean source-of-truth data module, route-level code splitting, a persistent three-part shell, a pure queue/shuffle engine, local persistence, and a compact passing test suite. Those are strong foundations for a large redesign.

The central technical problem is not framework quality; it is that the current domain model makes the metaphor the product. `Track` requires invented duration and play-count fields, the global provider simulates continuous playback, and the shell gives permanent space to controls that do not help a recruiter evaluate or contact the candidate (`src/data/library.ts:1-3`, `src/player/PlayerContext.tsx:38-115`, `src/shell/PlayerBar.tsx:16-83`). The migration should invert that relationship: verified career evidence becomes the domain model, while Spotify-inspired presentation becomes an adapter over it.

The safest path is evolutionary rather than a rewrite. Preserve the palette/tokens, wordmark, cover/card/playlist grammar, lazy routes, pure utilities, reduced-motion hook, and content taxonomy. Replace the Home and Artist information hierarchy first; introduce an evidence-first content schema beside the legacy `Track` schema; then adapt the shared row/card/player surfaces. This keeps every stage buildable and allows the theme to remain visible throughout.

## 1. Architecture map

### Runtime entry and provider tree

```text
index.html
  -> src/main.tsx
      -> React StrictMode
      -> BrowserRouter
          -> src/App.tsx
              -> PlayerProvider
              -> ToastProvider
              -> Suspense
              -> AppShell route
                  -> Sidebar / TopBar
                  -> <Outlet> page
                  -> QueuePanel / NowPlayingPanel
                  -> PlayerBar / BottomNav
```

- `index.html` defines the root element, social metadata, favicon, theme color, and the `/src/main.tsx` module entry (`index.html:3-21`).
- `src/main.tsx` mounts React in `StrictMode`, installs `BrowserRouter`, imports global styles, and renders `App` (`src/main.tsx:1-13`).
- `src/App.tsx` installs `PlayerProvider` and `ToastProvider`, then lazy-loads every page behind one `Suspense` boundary (`src/App.tsx:1-19`).
- The route tree has Home `/`, Search `/search`, Library `/library`, dynamic playlist `/playlist/:id`, Artist `/artist`, Liked `/liked`, and a catch-all NotFound route (`src/App.tsx:20-30`).
- `src/shell/AppShell.tsx` owns responsive shell composition, main-scroll tracking, right-panel state, mobile now-playing sheet state, focus movement on navigation, and global player keyboard shortcuts (`src/shell/AppShell.tsx:18-93`).
- Vercel rewrites extensionless paths to `index.html`, enabling client-side routing in production (`vercel.json:1-3`).

### Directory and module responsibilities

```text
src/
├── App.tsx, main.tsx, index.css    application composition, routing, global tokens
├── data/
│   └── library.ts                  all portfolio content and music-domain mapping
├── player/
│   ├── engine.ts                   pure next/previous/shuffle functions
│   ├── PlayerContext.tsx           global playback/queue/like/persistence state
│   └── useAmbient.ts               optional Web Audio oscillator pad
├── pages/
│   ├── Home.tsx                    quick picks and three shelves
│   ├── Search.tsx                  client-side content search and recents
│   ├── Library.tsx                 filtering, sorting, local search
│   ├── PlaylistPage.tsx            data-driven playlist detail
│   ├── ArtistPage.tsx              candidate profile, popular tracks, CTAs
│   ├── LikedSongs.tsx              achievements plus locally liked items
│   └── NotFound.tsx                catch-all UI
├── shell/
│   ├── AppShell.tsx                responsive chrome and routed content outlet
│   ├── Sidebar/TopBar/BottomNav     primary navigation and CV access
│   ├── PlayerBar/Queue/NowPlaying   simulated playback presentation
│   ├── TrackRow/MediaCard/Shelf     reusable content presentation
│   └── Art/PlayButton/Toast         visual and feedback primitives
├── lib/
│   ├── useLocalStorage.ts           JSON-backed browser persistence
│   ├── useReducedMotion.ts          live media-query preference
│   └── format.ts                    time and number formatting
├── icons/icons.tsx                 inline SVG icon components
└── test/setup.ts                   Testing Library DOM matchers
```

The original approved design specification describes this same architecture and deliberately centralizes all content in `data/library.ts` (`docs/superpowers/specs/2026-06-17-darshify-design.md:64-94`). The current implementation still follows it closely.

### Page data flow

- `src/data/library.ts` exports the artist, 20 tracks, four playlists, five genres, a seeded achievement list, cover selectors, a constant-time ID lookup, and contact details (`src/data/library.ts:12-71`).
- Pages import those arrays directly. There is no API client, loader, backend, CMS, schema validation, or remote error state.
- The player also imports the same `tracks`, `trackById`, and `likedTrackIds`, so portfolio content and playback state are tightly coupled (`src/player/PlayerContext.tsx:1-5`).
- `Home` derives quick picks locally and derives “Top Hits” by sorting the hard-coded play values (`src/pages/Home.tsx:20-29`).
- `PlaylistPage` resolves the dynamic route ID against `playlists`, then maps its track IDs through `trackById` (`src/pages/PlaylistPage.tsx:10-18`).
- `Search` filters all tracks and playlists in memory and persists up to six entered terms (`src/pages/Search.tsx:13-31`).
- `Library` reconstructs its own view model from the artist, Liked Songs, and playlists, then filters and sorts it in a `useMemo` (`src/pages/Library.tsx:23-34`).

## 2. Exact technology stack

The lockfile, not the semver ranges in `package.json`, is authoritative for installed versions.

| Layer | Installed version | Evidence |
|---|---:|---|
| React | 19.2.7 | `package-lock.json:3555` |
| React DOM | 19.2.7 | `package-lock.json:3564` |
| React Router DOM | 7.18.0 | `package-lock.json:3606` |
| Framer Motion | 12.40.0 | `package-lock.json:2634` |
| Tailwind CSS | 4.3.1 | `package-lock.json:3789` |
| Tailwind Vite plugin | 4.3.1 | `package-lock.json:1381` |
| TypeScript | 6.0.3 | `package-lock.json:3932` |
| Vite | 8.0.16 | `package-lock.json:4028` |
| Vitest | 4.1.9 | `package-lock.json:4106` |
| ESLint | 10.5.0 | `package-lock.json:2339` |
| Testing Library React | 16.3.2 | `package-lock.json:1444` |
| jsdom | 29.1.1 | `package-lock.json:2833` |

Local runtime observed during this research: Node `v25.9.0`, npm `11.12.1`. The repository does not pin Node through `.nvmrc`, `.node-version`, Volta, or a `package.json#engines` field, so CI and local reproducibility are currently under-specified.

Build and configuration details:

- ESM package (`"type": "module"`) with Vite scripts (`package.json:2-12`).
- Tailwind v4 is loaded through `@tailwindcss/vite`; Vitest runs in jsdom with one setup file (`vite.config.ts:1-8`).
- App TypeScript targets ES2023, uses bundler resolution, React JSX transform, no emit, forced module detection, no unused locals/parameters, erasable syntax, and no fallthrough (`tsconfig.app.json:3-24`).
- Root TypeScript config uses project references for the app and Vite config (`tsconfig.json:1-7`).
- ESLint uses the recommended JavaScript, TypeScript, React Hooks, and React Refresh flat configurations, but it is not type-aware (`eslint.config.js:1-22`; the generated README itself notes the missing type-aware setup at `README.md:16-43`).
- The single variable TTF is bundled and loaded with `font-display: swap` (`src/index.css:9-11`).
- Production deployment is a static Vite bundle with SPA rewrites; there is no server runtime (`vercel.json:1-3`).

## 3. Code conventions and implementation patterns

### Naming and structure

- React components and their files use PascalCase: `PlayerBar`, `TrackRow`, `ArtistPage`.
- Hooks use a `use` prefix and camelCase: `usePlayer`, `useAmbient`, `useLocalStorage`, `useReducedMotion`.
- Data exports and functions use camelCase; true module constants use uppercase names such as `ALL`, `CHORDS`, `LIKED_COVER`, and `ARTIST_HERO` (`src/player/PlayerContext.tsx:27-35`; `src/data/library.ts:48-58`).
- Domain IDs encode kind with short prefixes (`s1`, `r1`, `p1`, `a1`, `c1`) and playlists use semantic slugs (`experience`, `projects`, `skills`, `certs`) (`src/data/library.ts:18-46`).
- Components mostly co-locate prop types inline rather than defining shared prop interfaces (`src/shell/MediaCard.tsx:4-6`, `src/shell/PlayButton.tsx:3-5`).
- Styling is almost entirely Tailwind utility strings, with only theme tokens, font setup, scrollbar styling, and minimal global rules in `src/index.css` (`src/index.css:1-17`).

### State management

- Global cross-route state is limited to React context: playback/queue/likes in `PlayerProvider` and transient notifications in `ToastProvider` (`src/App.tsx:17-18`).
- Page-local UI uses `useState`, e.g. Search query/recents, Library filter/sort/menu, Artist follow state, and TrackRow details/context menu (`src/pages/Search.tsx:13-16`; `src/pages/Library.tsx:8-12`; `src/pages/ArtistPage.tsx:11-16`; `src/shell/TrackRow.tsx:9-18`).
- Browser persistence uses a generic JSON hook that gracefully falls back on read or write errors. It currently stores `dx_vol`, `dx_likes`, `dx_audio`, and `dx_recents` (`src/lib/useLocalStorage.ts:3-16`; `src/player/PlayerContext.tsx:44-48`; `src/pages/Search.tsx:15`).
- Derived lists use `useMemo` in Search, Library, and the context value. Small lists are also re-sorted inline on render (`src/pages/Search.tsx:18-25`; `src/pages/Library.tsx:23-34`; `src/player/PlayerContext.tsx:109-113`; `src/pages/Home.tsx:29`).

### Error and edge-state handling

- `usePlayer` fails fast when used outside its provider (`src/player/PlayerContext.tsx:19-24`).
- Invalid playlist IDs render the branded `NotFound` component, and unmatched routes also resolve to it (`src/pages/PlaylistPage.tsx:10-14`; `src/App.tsx:25-28`).
- `Art` keeps a CSS gradient behind every image and hides a failed image, so the layout survives missing cover art (`src/shell/Art.tsx:1-15`).
- Local-storage parse, quota, and availability errors are intentionally swallowed with a safe initial-value fallback (`src/lib/useLocalStorage.ts:4-14`).
- Clipboard failure is silently ignored; success feedback is still shown regardless because the promise is not awaited before calling the toast (`src/shell/TrackRow.tsx:73-74`). This is a correctness defect for future evidence/share actions.
- There is no application-level error boundary, asynchronous route error UI, analytics failure handling, schema validation, or network retry because the current site has no network data dependency.
- `Suspense` has one generic full-screen “Loading…” state (`src/App.tsx:19`), but no skeletons aligned with page layouts.

### Testing pattern and current coverage

- Vitest globals plus jsdom and `@testing-library/jest-dom` are configured centrally (`vite.config.ts:5-8`; `src/test/setup.ts:1`).
- Pure logic tests cover time/number formatting, next/previous/repeat behavior, and deterministic shuffling (`src/lib/format.test.ts:1-12`; `src/player/engine.test.ts:1-20`).
- Data tests verify candidate presence, minimum catalogue size, playlist referential integrity, and genre availability (`src/data/library.test.ts:1-15`).
- One component test renders `TrackRow` with a mocked player, checks title/duration, and verifies that Play calls the context action (`src/shell/TrackRow.test.tsx:1-21`).
- One hook test stubs `matchMedia` and checks the initial reduced-motion result (`src/lib/useReducedMotion.test.ts:1-12`).
- Current total: 5 files / 10 tests. There are no route tests, end-to-end tests, accessibility assertions, mobile tests, image-performance budgets, visual regression tests, contact/download tests, or coverage reporting threshold.
- The original spec promised broader resilience coverage, Home tests, like persistence, and Lighthouse >=90 (`docs/superpowers/specs/2026-06-17-darshify-design.md:110-124`); those checks are not all represented in the present suite.

## 4. Existing functionality that overlaps the redesign

The following is already valuable and can be retained or adapted rather than rebuilt.

### Spotify/music-streaming identity

- A stable Darshify wordmark and play-glyph treatment exist in the Sidebar (`src/shell/Sidebar.tsx:13-19`).
- Near-black surfaces, card elevation, muted text, and green accent are centralized as theme tokens (`src/index.css:2-10`).
- Reusable `Shelf`, `MediaCard`, `TrackRow`, `PlayButton`, and `Art` components already encode the main music-app visual grammar (`src/shell/Shelf.tsx:4-20`; `src/shell/MediaCard.tsx:4-24`; `src/shell/TrackRow.tsx:9-80`; `src/shell/PlayButton.tsx:3-16`; `src/shell/Art.tsx:1-19`).
- Playlist, Artist, Liked Songs, Search, Library, now-playing, and queue views are already routed and responsive (`src/App.tsx:20-29`; `src/shell/AppShell.tsx:52-92`).

### Recruiter-relevant content and conversion

- The data already includes quantified internship, project, competition, certification, CGPA, leadership, and contact claims (`src/data/library.ts:12-38`, `src/data/library.ts:71`).
- CV, email, and LinkedIn actions are implemented. The CV is downloadable from the Sidebar, TopBar, and Artist About section; email and LinkedIn are on Artist (`src/shell/Sidebar.tsx:47-50`; `src/shell/TopBar.tsx:29-32`; `src/pages/ArtistPage.tsx:51-59`).
- Search covers titles, subtitles, and details across the complete catalogue (`src/pages/Search.tsx:18-25`).
- Dynamic playlist pages mean Experience, Projects, Skills, and Certifications can keep their album/playlist wrappers while receiving richer recruiter content (`src/pages/PlaylistPage.tsx:10-45`).
- `NowPlayingPanel` already has a detail region and an About card. It can become a “now viewing” evidence drawer without requiring a new responsive panel primitive (`src/shell/NowPlayingPanel.tsx:14-39`).

### Interaction and resilience primitives

- Route changes deliberately reset scroll and move focus to an H1 (`src/shell/AppShell.tsx:27-34`). The behavior needs refinement, but the concern already has a dedicated seam.
- `useReducedMotion` listens for live preference changes and already gates Framer Motion panels/sheets (`src/lib/useReducedMotion.ts:3-15`; `src/shell/AppShell.tsx:50-50`, `src/shell/AppShell.tsx:84-89`).
- Route-level code splitting keeps page chunks small (`src/App.tsx:7-13`).
- `Art` provides an image-failure fallback (`src/shell/Art.tsx:7-15`).
- Pure `trackById`, formatting, and queue helpers are isolated and tested (`src/data/library.ts:68-69`; `src/lib/format.ts:1-5`; `src/player/engine.ts:1-27`).

## 5. Integration surfaces to reuse

### Content/data layer

The current `library.ts` is the main integration point. It should remain the single import boundary for pages during migration, but its underlying data should be separated into truthful career entities and themed projections.

Recommended migration seam:

```text
CareerItem / Proof / Contact / Profile  (truthful source model)
                    |
                    v
        streaming presentation adapter
          Album / TrackView / ShelfView
                    |
                    v
        existing routes and shell components
```

This permits pages to keep consuming music-shaped view models while fabricated `plays`, `monthlyListeners`, and `durationSec` disappear from the source facts. Current coupling is visible in the mandatory `Track` fields and hard-coded artist listener field (`src/data/library.ts:1-3`, `src/data/library.ts:12-15`).

The `Map` behind `trackById` is the right lookup pattern and can be generalized to `itemById` or kept behind a compatibility adapter (`src/data/library.ts:68-69`).

### Routing

- Keep `BrowserRouter`, the lazy-route pattern, and the shared shell route (`src/main.tsx:3-11`; `src/App.tsx:7-29`).
- Preserve existing public URLs initially to avoid breaking links: `/`, `/search`, `/library`, `/playlist/:id`, `/artist`, `/liked`.
- `PlaylistPage` is already data-driven; richer content can be introduced without proliferating separate section pages (`src/pages/PlaylistPage.tsx:10-18`).
- If project case studies need dedicated URLs, add a route such as `/track/:id` or `/project/:id` beside the existing playlist route rather than overloading `TrackRow` local disclosure.

### Context and hooks

- `usePlayer` is used across Home, playlist/artist/liked pages, rows, player chrome, and panels. It is therefore a high-blast-radius interface and should be adapted behind its existing API before wholesale removal (`src/player/PlayerContext.tsx:7-17`).
- A transitional provider can reinterpret `play(track)` as “select/open item” while retaining a restrained preview/player affordance. Later, split selection (`PortfolioSelectionContext`) from optional audio playback to stop all content interactions from causing timer and queue work.
- Continue using `useLocalStorage` for visitor preferences such as muted audio, theme density, or saved shortlist, but version stored schemas/keys before changing `likes` semantics (`src/lib/useLocalStorage.ts:3-16`; `src/player/PlayerContext.tsx:44-48`).
- Reuse `useReducedMotion` throughout new motion; extend global CSS to disable nonessential CSS animations and transitions as well (`src/lib/useReducedMotion.ts:3-15`; current limited rule at `src/index.css:17`).
- Keep Toast as an integration surface only after adding semantic status announcement and promise-aware success/failure behavior (`src/shell/Toast.tsx:8-27`).

### Shared UI components

- `Art` should become the only image-delivery boundary. That makes it the correct place to add `picture`, responsive sources, intrinsic dimensions/aspect ratio, eager/high-priority hero behavior, and decoding hints (`src/shell/Art.tsx:3-15`).
- `MediaCard` and `TrackRow` are ideal adaptation points for proof-rich cards/rows. Their public props are small, so they can accept a richer view model without rewriting every page (`src/shell/MediaCard.tsx:4-6`; `src/shell/TrackRow.tsx:9-11`).
- `Shelf` is reusable for “Selected work,” “Experience,” or “Evidence playlists,” but it needs accessible carousel controls or a responsive grid when clipping occurs (`src/shell/Shelf.tsx:4-18`).
- `NowPlayingPanel` can display case-study evidence, role, date, outputs, tools, proof links, and recruiter takeaways while preserving the now-playing metaphor (`src/shell/NowPlayingPanel.tsx:20-34`).
- `TopBar` is the natural persistent conversion surface; it already owns CV access and route-aware tinting (`src/shell/TopBar.tsx:4-18`, `src/shell/TopBar.tsx:20-36`).

### No current external APIs

There are no fetches or API clients. All content is compiled into the bundle, audio is generated locally, and persistence is browser-only (`docs/superpowers/specs/2026-06-17-darshify-design.md:29-34`; `src/player/useAmbient.ts:10-35`). A CMS, analytics, contact backend, or credential-verification service would be a new subsystem rather than an extension of an existing integration.

## 6. Adjacent technical debt and redesign risks

### Domain honesty and information architecture

- `monthlyListeners`, per-track `plays`, and `durationSec` are hard-coded presentation fiction required by the current data model (`src/data/library.ts:2`, `src/data/library.ts:14`, `src/data/library.ts:18-39`).
- Artist displays a hard-coded “Verified Candidate” badge and listener count with no source (`src/pages/ArtistPage.tsx:25-27`).
- Home computes “Top Hits” from fabricated play values (`src/pages/Home.tsx:29`, `src/pages/Home.tsx:59-63`).
- Follow is ephemeral component state; it has no persistence or recruiter meaning (`src/pages/ArtistPage.tsx:11-16`, `src/pages/ArtistPage.tsx:34-37`).
- “Recents” does not sort by time; it means declaration order (`src/pages/Library.tsx:21-34`).
- Track “Copy link” always copies `/artist`, not a track URL, and announces success even if the clipboard write rejects (`src/shell/TrackRow.tsx:68-76`).
- The static audit counted 207 canonical desktop authored interactions around a simple evaluation task (`DESIGN-IS-2026-08-29/01-structural-copy.md:28-52`). This indicates orchestration complexity even though the source tree is small.

### Accessibility and semantics

- Six primary Home tiles are clickable `div`s with no link semantics or keyboard handler (`src/pages/Home.tsx:35-49`).
- Their child Play buttons are focusable but visually hidden at opacity zero until pointer hover (`src/pages/Home.tsx:42-47`).
- `MediaCard` nests a button inside a link, which is invalid interactive nesting and produces redundant focus stops (`src/shell/MediaCard.tsx:8-22`).
- TrackRow hover-only actions are also opacity-zero without focus-visible/focus-within equivalents (`src/shell/TrackRow.tsx:35-56`).
- Route focus jumps directly to the page H1. Because global navigation precedes main content in the DOM, forward Tab after navigation skips Back/Forward, desktop CV, and Sidebar until focus wraps (`src/shell/AppShell.tsx:27-34`, `src/shell/AppShell.tsx:52-81`).
- There is no skip link; visible nav landmarks are unnamed; Toast is not an aria-live/status region (`src/shell/Sidebar.tsx:11`; `src/shell/BottomNav.tsx:9`; `src/shell/Toast.tsx:19-24`; corroborated by `DESIGN-IS-2026-08-29/01-visual-accessibility.md:97-103`).
- The Search input and Library search input rely on placeholders rather than labels (`src/pages/Search.tsx:35-40`; `src/pages/Library.tsx:47-48`).
- Reduced motion gates Framer Motion panel movement but not the perpetual player pulse, toast keyframe, or general transitions (`src/shell/AppShell.tsx:50`, `src/shell/AppShell.tsx:84-89`; `src/shell/PlayerBar.tsx:44-53`; `src/shell/Toast.tsx:19-26`; `src/index.css:17`).

### Responsive conversion and layout

- Sidebar is hidden below `md`; TopBar's CV button is hidden below `sm`. Mobile therefore has no Home-level CV/contact action (`src/shell/Sidebar.tsx:11`, `src/shell/Sidebar.tsx:47-50`; `src/shell/TopBar.tsx:29-32`).
- Mobile retains a 64px player plus BottomNav. The audit measured 122px/14.5% of a 390x844 viewport consumed by persistent bottom chrome (`src/shell/PlayerBar.tsx:17`; `src/shell/BottomNav.tsx:9`; `DESIGN-IS-2026-08-29/01-visual-accessibility.md:105-110`).
- Shelves are unlabelled horizontal scrollers with no previous/next controls; 176px fixed cards truncate long labels and clip at desktop edges (`src/shell/Shelf.tsx:17`; `src/shell/MediaCard.tsx:9-13`).
- The “Press play” callout is absolutely positioned above the player without reserving layout space (`src/shell/PlayerBar.tsx:44-54`).

### Performance and assets

- Route splitting works, but Framer Motion is imported by the always-loaded AppShell (`src/App.tsx:7-13`; `src/shell/AppShell.tsx:3`). The prior production audit measured the shared shell at 385,845 raw / 123.92kB gzip (`DESIGN-IS-2026-08-29/01-weight-friction.md:49`).
- The real failure is imagery: the cold Home transferred 10.946MiB total; six PNG covers were 95.9% of the decoded initial payload (`DESIGN-IS-2026-08-29/01-weight-friction.md:18-47`).
- `Art` emits only a single `<img src>` with `loading="lazy"`; there are no AVIF/WebP variants, responsive sizes, or `srcset` (`src/shell/Art.tsx:3-15`).
- Quick-pick art renders at 64x64 CSS pixels while downloading 1024–1254px masters (`src/pages/Home.tsx:36-45`; `DESIGN-IS-2026-08-29/01-weight-friction.md:53-78`).
- Home creates 26 image elements referencing only six URLs and repeats the same Skills cover for all six “Top Hits” (`src/pages/Home.tsx:52-73`; `src/data/library.ts:54-58`).
- The bundled font is TTF-only; there is no WOFF2 or subset (`src/index.css:11`; `DESIGN-IS-2026-08-29/01-weight-friction.md:80-84`).

### State correctness and maintainability

- `PlayerContext` keeps an rAF-driven progress state at the global provider level. While playing, the context value changes every frame, so every `usePlayer` consumer can re-render even when it only needs `likes` or an action (`src/player/PlayerContext.tsx:81-100`, `src/player/PlayerContext.tsx:109-115`).
- `useMemo` does not solve this because `progress` is a dependency and functions are recreated per provider render (`src/player/PlayerContext.tsx:55-79`, `src/player/PlayerContext.tsx:109-113`). Splitting state/actions or using an external selector store would lower the blast radius if playback remains.
- `toggleLike` and `toggleAudio` read render-captured state instead of functional updates (`src/player/PlayerContext.tsx:76-79`). This is unlikely to fail under current human click rates but is fragile under batched/rapid actions.
- Enqueue permits duplicate IDs and queue growth without a limit (`src/player/PlayerContext.tsx:75`). Liked Songs deduplicates separately using a Set each render (`src/pages/LikedSongs.tsx:9-12`).
- `hasTrack` is initialized `true` and never set false, making “no current track” fallbacks effectively unreachable (`src/player/PlayerContext.tsx:51-53`; `src/shell/PlayerBar.tsx:34-36`; `src/shell/NowPlayingPanel.tsx:36-38`).
- AppShell's keyboard effect depends on the entire context object, which changes with progress, so the global key listener is torn down and re-added continuously during playback (`src/shell/AppShell.tsx:36-48`; `src/player/PlayerContext.tsx:109-113`).
- `Search` allocates concatenated/lowercased strings and scans every track on each query update. Fine for 20 tracks, but not ready for hundreds of case-study artifacts (`src/pages/Search.tsx:18-25`).
- Data, cover mapping, presentation gradients, recruiter facts, and fabricated metrics live in one dense file. That encourages copy edits to modify implementation-facing structure (`src/data/library.ts:1-71`).

### Tooling and delivery

- `package.json` has no dedicated `type-check`, `format`, `format:check`, `coverage`, or end-to-end test script (`package.json:6-12`).
- No `.github/workflows/ci.yml` exists. This violates the supplied protocol's required CI gate and must become the first execution task.
- Node/npm are unpinned, and there is no lockfile-enforced `npm ci` documented in the README.
- The README is still the generic Vite template and does not document product purpose, architecture, local commands, content editing, asset requirements, accessibility constraints, or deployment (`README.md:1-72`).
- There is no formatter configuration. Existing quote/semicolon style is mostly consistent in source, but `eslint.config.js` uses a different generated style (`eslint.config.js:1-22`).
- ESLint is not type-aware and has no explicit jsx-a11y rules (`eslint.config.js:8-21`).
- Tests have no coverage threshold, and the production experience has no automated browser quality gate.

## 7. Quality-gate command mapping

### Commands available today

| Gate | Exact command | Current result | Notes |
|---|---|---|---|
| Install | `npm ci` | Not rerun in this read-only pass | Lockfile exists; use this in CI. |
| Lint | `npm run lint` | Pass, no warnings | Runs `eslint .` (`package.json:9`). |
| Type-check | `npx tsc -b` | Covered by build | No dedicated script. `npm run build` begins with `tsc -b` (`package.json:8`). |
| Unit/component tests | `npm test` | Pass: 5 files, 10 tests | Runs `vitest run --passWithNoTests` (`package.json:11`). |
| Production build | `npm run build` | Pass: Vite 8.0.16, 453 modules | Current output has a 385.84kB raw / 123.91kB gzip shared JS chunk. |
| Preview | `npm run preview -- --host 127.0.0.1 --port 4173` | Script exists | Required for browser smoke tests (`package.json:10`). |

All three current gates were rerun on this inspected revision: lint exited 0; all 10 tests passed; TypeScript plus Vite build exited 0.

### Required additions before implementation tasks close

1. Add `type-check` mapped to `tsc -b --pretty false` so type correctness is independently visible.
2. Add formatter/check scripts and a repository formatter config.
3. Add `test:coverage` with a new-code threshold selected in Phase 2.
4. Add an end-to-end/browser smoke command covering all routes, recruiter CTAs, keyboard navigation, reduced motion, and mobile breakpoints.
5. Add an accessibility gate, ideally axe checks on Home, Artist, playlist/case-study detail, Search results/no-results, and the mobile shell.
6. Add asset/performance budgets: first-view transferred bytes, maximum image derivative size, no PNG master loaded for thumbnail use, and route-chunk caps.
7. Add `.github/workflows/ci.yml` with separate quality, test, and build jobs; none exists today.
8. Pin the Node major version for local and CI parity. Vite 8 requires a modern Node line; the current local Node 25 should not become an accidental CI contract.

The previous evidence sweep recorded zero HTTP/network/console/runtime/broken-image errors on seven routes and passing lint/test/build (`DESIGN-IS-2026-08-29/01-weight-friction.md:110-131`). That is a useful baseline, but it was a one-off audit rather than a repeatable repository command.

## 8. Migration seams: preserve Spotify, replace recruiter flow

### Seam A — domain model before page rewrites

Introduce evidence-first entities alongside the current `Track` interface. Each item should hold stable identity, category, role/client, dates, summary, problem, actions, outcome metrics, tools/skills, evidence links/assets, and recruiter takeaway. Keep Spotify nouns only in a presentation adapter. This lets the current UI compile while invented metrics are removed incrementally.

Why this seam is safe: all current pages already read through one module (`src/data/library.ts:1-71`), and playlist detail uses ID lookup rather than embedded objects (`src/pages/PlaylistPage.tsx:10-18`).

### Seam B — Home becomes recruiter-first without losing shelves

Keep the dark shell, quick-pick visual density, album covers, and shelves, but change the first viewport contract:

- one-sentence positioning and job target;
- real quantified proof;
- persistent CV/email/LinkedIn actions at every breakpoint;
- selected projects/experience represented as playlists or releases;
- a clear explanation of what “play” does.

`Home` is route-local and lazy, so its information architecture can change without disturbing the player engine or other routes (`src/App.tsx:7`, `src/pages/Home.tsx:14-76`).

### Seam C — Artist becomes the canonical candidate profile

Preserve the Artist page grammar—hero, primary action, Popular, Discography, About—but replace verification/listener/follow fiction with sourceable facts, “Selected evidence,” portfolio collections, and direct conversion (`src/pages/ArtistPage.tsx:18-59`). This is the strongest theme-preserving conversion because recruiters already understand “artist profile” as the candidate overview.

### Seam D — “play” becomes meaningful selection

Do not force the Spotify theme to mean fake audio. Define Play as opening a narrated case-study/evidence sequence or selecting an item in the now-viewing panel. If ambient audio remains, make it optional embellishment and decouple it from progress/duration. `NowPlayingPanel` already supports responsive panel/sheet presentation (`src/shell/AppShell.tsx:63-92`; `src/shell/NowPlayingPanel.tsx:6-39`).

Transitional strategy:

1. Keep `usePlayer.play(track, context)` as a compatibility façade.
2. Internally separate `selectedItemId`/`selectionContext` from audio state.
3. Update consumers to use `useSelection` where no audio behavior is needed.
4. Reduce the bottom player to a compact “now exploring” bar with Resume/Next/Open; retain the recognizable music control silhouette only where it has a real behavior.
5. Remove rAF progress and invented duration only after all callers have migrated.

### Seam E — reusable view primitives

- Convert quick-pick tile roots to semantic `Link`s and expose Play as a sibling control, not a nested interactive descendant (`src/pages/Home.tsx:35-49`).
- Convert `MediaCard` to a wrapper with sibling destination/action elements while preserving its art, typography, and hover reveal (`src/shell/MediaCard.tsx:8-22`).
- Extend `TrackRow` details into a concise proof accordion or link to a dedicated case study, preserving numbered-track rhythm (`src/shell/TrackRow.tsx:33-66`).
- Extend `Art` to a responsive asset component before generating replacement candidate-specific artwork (`src/shell/Art.tsx:3-15`).

### Seam F — responsive shell

Preserve desktop Sidebar and mobile BottomNav initially, but promote Contact/CV to a persistent, semantic action group. The current TopBar already centralizes scroll tint and CV behavior (`src/shell/TopBar.tsx:14-35`). The PlayerBar can be collapsed or conditional on mobile to reclaim the measured 122px of chrome while still surfacing a themed mini-player after a user selects evidence.

### Seam G — asset migration

Keep gradient fallback and the idea of album art, but replace the seven master PNGs with candidate-specific source artifacts and generated responsive derivatives. Because all pages go through `Art`, the image-pipeline migration can happen once (`src/shell/Art.tsx:3-15`). Target a sub-1MiB first view, as already recommended by the prior audit (`DESIGN-IS-2026-08-29/03-verdict.md:5-11`).

## 9. Algorithm and data-processing risks

This is not an algorithm-heavy product today, but Large scope requires explicit complexity boundaries so richer evidence, search, analytics, or CMS content does not introduce avoidable regressions.

### Current operations

| Operation | Current complexity | Space | Evidence / risk |
|---|---:|---:|---|
| `trackById(id)` | O(1) average | O(n) index | Precomputed `Map` (`src/data/library.ts:68-69`). Preserve this pattern. |
| Playlist hydration | O(k) | O(k) | Map `k` IDs through the lookup (`src/pages/PlaylistPage.tsx:16`). |
| Home/Artist ranking | O(n log n) | O(n) | Clone, sort by fabricated plays, slice six (`src/pages/Home.tsx:29`; `src/pages/ArtistPage.tsx:15`). Recompute per render. |
| Search query | O(n * m) per keystroke | O(r) plus transient strings | Scans tracks and concatenates/lowercases searchable fields (`src/pages/Search.tsx:18-25`); `m` is searchable text length. |
| Library filter/sort | O(n) normally; O(n log n) for A–Z | O(n) | Memoized view-model construction (`src/pages/Library.tsx:23-34`). |
| Shuffle | O(n) | O(n) | Fisher–Yates over a generated index array (`src/player/engine.ts:12-27`). |
| Like lookup | O(l) | O(l) persisted | `likes.includes(id)` and filters use arrays (`src/player/PlayerContext.tsx:76-78`). |
| Liked union | O(a + l) expected | O(a + l) | Rebuilds `Set` each render (`src/pages/LikedSongs.tsx:9-12`). |
| Queue append | O(n) immutable copy | O(n) per append | Array spread (`src/player/PlayerContext.tsx:75`). |
| Queue panel projection | O(q) | O(q) | Slices/maps/filter on render (`src/shell/QueuePanel.tsx:5-8`). |
| Player progress | O(c) render work per animation frame | O(1) state | Context progress updates can re-render all `c` consumers up to display refresh rate (`src/player/PlayerContext.tsx:81-100`, `src/player/PlayerContext.tsx:109-115`). This is the highest current algorithmic/runtime risk. |

### Complexity targets for the redesign

- **ID resolution:** O(1) average via prebuilt maps for projects, roles, evidence, and collections.
- **Initial render selection:** O(n) maximum. Do not sort the full collection inside render when editorial “featured” order can be explicit in data.
- **Search under 500 items:** O(n * m) per query is acceptable only with pre-normalized searchable text and a 100–150ms debounce/deferred update. Target under 50ms on a mid-range mobile device.
- **Search at 500+ items or CMS scale:** build a one-time O(n * m) normalized/token index; query should be O(n) over compact normalized strings or use a lightweight indexed search only if measured need justifies it. Do not add a large search dependency for a 20-item catalogue.
- **Likes/saved shortlist:** O(1) membership with `Set` in memory and a serializable array only at the storage boundary.
- **Queue/sequence navigation:** O(1) next/previous/jump; O(n) only when creating or shuffling a context.
- **Filter/sort:** O(n log n) worst case for user-invoked sorting, never repeated every animation frame or unrelated state update.
- **Global state updates:** selection changes may re-render selection consumers once; progress/audio animation must not update the entire routed app at 60Hz. If real progress remains, store it locally in the visible player or expose selector-based subscriptions.
- **Memory:** O(n + asset metadata). Do not preload decoded full-size imagery; use responsive files and browser-native lazy loading. Keep preloaded first-view images bounded to visible hero and above-fold cards.
- **Payload:** sub-1MiB transferred first view, no thumbnail request above roughly 100–150kB, and no full-resolution work artifact fetched until its detail view opens.

### Data integrity targets

- All collection references resolve, extending the existing playlist integrity test (`src/data/library.test.ts:9-11`).
- Every public claim carries a source/proof classification: verified document/link, résumé-sourced, or clearly labelled narrative. Synthetic engagement fields should not exist in the source domain.
- Every image requires dimensions, alt/decorative intent, responsive derivatives, and a fallback.
- Every externally navigable evidence item has a stable slug/URL; Copy Link must copy that exact URL.
- Content schema validation should fail the build for duplicate IDs, missing collection references, missing CTA targets, or unlabelled claims.

## 10. Design evidence and original-spec implications

The approved 2026-06-17 design explicitly required an “exact app experience,” complete player controls, all six current routes, desktop-first behavior, and original branding/assets (`docs/superpowers/specs/2026-06-17-darshify-design.md:7-27`, `docs/superpowers/specs/2026-06-17-darshify-design.md:29-52`). That explains why implementation quality concentrated on simulation completeness rather than recruiter conversion.

The specification also set performance and accessibility expectations—route-level splitting, lazy panels, Lighthouse >=90, real buttons, route focus, reduced motion, and resilient states (`docs/superpowers/specs/2026-06-17-darshify-design.md:110-124`). The implementation partially satisfies these but does not meet them comprehensively.

The 2026-08-29 audit evidence establishes the main technical facts relevant to redesign:

- the audience/task is recruiter evaluation and contact, not music consumption (`DESIGN-IS-2026-08-29/01-evidence.md:11-17`);
- the dark token system and contrast are strong (`DESIGN-IS-2026-08-29/01-evidence.md:19-23`);
- hard-coded platform signals and labels create honesty/behavior mismatches (`DESIGN-IS-2026-08-29/01-evidence.md:39-45`);
- keyboard reachability, focus visibility, mobile conversion, and redundant interaction patterns need structural fixes (`DESIGN-IS-2026-08-29/01-evidence.md:52-57`; `DESIGN-IS-2026-08-29/01-visual-accessibility.md:56-103`);
- image delivery, not JavaScript, dominates performance cost (`DESIGN-IS-2026-08-29/01-weight-friction.md:18-49`);
- lint, unit tests, build, routed runtime, and assets were otherwise stable (`DESIGN-IS-2026-08-29/01-weight-friction.md:110-140`).

Therefore, “Spotify-themed throughout” is technically compatible with the Large redesign. The constraint does not require retaining fabricated metrics, invalid semantics, a 60Hz global timer, a permanently expanded player, or 12MiB of album art. The theme can live in palette, information grouping, album/track visual language, motion, microcopy, and an optional meaningful now-viewing/player layer while recruiter evidence owns the hierarchy.

## 11. Recommended codebase boundaries for the plan

These are sequencing boundaries, not implementation tasks:

1. **Foundation gate:** add CI, pinned runtime, independent type-check/format/coverage commands, and baseline browser/accessibility tests.
2. **Content contract:** introduce evidence-first data and validation while maintaining legacy adapters.
3. **Asset system:** upgrade `Art` and produce responsive, candidate-specific media before new layouts multiply old payload behavior.
4. **Recruiter-first routes:** redesign Home and Artist against the new model; make conversion persistent on mobile and desktop.
5. **Evidence detail:** upgrade playlist/row/panel or add stable detail routes for case-study proof.
6. **Shell and player split:** separate item selection from optional audio; slim persistent chrome, especially on mobile.
7. **Search/library:** index the new content fields, replace false Recents behavior, and preserve the themed browsing model.
8. **Hardening:** keyboard, screen reader, reduced motion, responsive, performance, route integrity, and conversion verification.

This ordering keeps the existing site operational and recognizably Darshify after every phase while systematically replacing the recruiter-flow liabilities.
