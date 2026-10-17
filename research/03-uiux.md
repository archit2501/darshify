# Darshify UI/UX research (Agent 3): immersive Spotify-faithful redesign

> **Date:** 2026-10-17 · **Scope:** Large · **Supersedes:** the 2026-08-29 "recruiter briefing" version of this file, which is still in git history (commit `60fd7a2`).
> **New brief from the owner:** visitors should feel they are literally inside the Spotify app, on every page and in every section, and stay mesmerized. SEO and WCAG still matter.

## How this audit was produced

- **Renders:** I captured 93 screenshots of the running dev server (`http://localhost:5173`) with a throwaway Playwright script. That covers 14 routes at 1440×900, 820×1180 and 390×844, with fold and full-page shots, plus card and row hover, keyboard focus after 4×Tab, Career Mix open on Home and on a playlist, and Search with the query "excel". The files live in the session scratchpad (`…/scratchpad/screens/*.png`, script `…/scratchpad/shoot.cjs`) and are not in the repo. They are cited below as `screens/<file>`.
- **Probes:** I used Playwright `evaluate` for computed colors and fonts, element geometry, chrome heights and horizontal overflow, and `curl` on the SSR HTML to count copy phrases.
- **Code:** I read every shell, page and component file. Citations use the form `path:line`.

### Measured facts behind the verdicts

| Measure                      | Value                                                                                                                                                                                   | Evidence                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Persistent bottom player     | **None** until "Start Career Mix" is pressed                                                                                                                                            | `src/shell/AppShell.tsx:39`, `src/career-mix/CareerMixDock.tsx:27`                     |
| Career Mix play/pause button | **White icon on a white circle**: computed `color: rgb(255,255,255)` on `background: rgb(255,255,255)`, so the main transport control is blank                                          | `CareerMixDock.tsx:19-20` + `:97`; `screens/desktop-home-careermix-open.png`           |
| Mobile chrome while playing  | Dock 215 px + tab bar 61 px = **276 px (33 % of an 844 px viewport)**, leaving main at 552 px                                                                                           | `screens/mobile-home-careermix-open.png`                                               |
| Page lengths                 | Home 2,570 px desktop / **5,751 px mobile**; Artist **8,418 px mobile**                                                                                                                 | full-page captures                                                                     |
| Mobile hero collision        | H1 box `x 41–349` overlaps the cover thumbnail `x 269–349`, so "Darshil Jain" runs under the art                                                                                        | `src/components/RecruiterHero.tsx:132`; `screens/mobile-home-fold.png`                 |
| Defensive copy in SSR HTML   | "self-reported": Home 5, Artist 7, Skills 8, **Figmenta case study 10**. "résumé": 14–**23** per page                                                                                   | curl on `/`, `/artist`, `/playlist/skills`, `/case-studies/figmenta-operations-intern` |
| Fonts rendered               | Archivo Variable, IBM Plex Mono, plus **Arial/Courier inside the SVG covers** (an `<img>`-embedded SVG can't use the page's web fonts)                                                  | `src/styles/base.css:1-17`, `public/artifacts/experience.svg`                          |
| Cover art                    | 6 SVGs, **1 template** (black field, green bar, mono text), **0 photos**. "Figmenta" headlines 2 of the 6 collection covers, and the profile cover repeats the same "500+ résumés" stat | `public/artifacts/*.svg`, `src/components/EvidenceCover.tsx:72-152`                    |
| Track row height             | ≈ **222 px** per row (Spotify uses 56 px)                                                                                                                                               | `screens/desktop-pl-projects-fold.png`                                                 |
| Card hover                   | Background goes from `#1b1b1b` to `#303030` with **no play button**                                                                                                                     | `screens/desktop-home-hover-card-scrolled.png`                                         |
| Horizontal overflow          | None at any viewport (good)                                                                                                                                                             | probe `scrollWidth == clientWidth`                                                     |

---

# Part A: Audit

Spotify's look is a wall of colorful square artwork, heavy titles, a color that bleeds from the artwork into the page, dense 56 px track rows, and a player that is always there. Darshify has almost none of that. It currently reads as **a dark compliance report wearing a Spotify sidebar**. The previous pass made it more honest by removing fake plays and listeners, but it did so by turning every surface into a disclaimer. Monospace provenance labels, bordered cards, "Recruiter briefing", "Evidence in this collection", and "self-reported" ten times on one page together kill any sense of being inside an app. The foundations are good (SSR, accessibility plumbing, a clean content model), and the presentation layer needs to be rebuilt almost entirely.

## A0. Worth keeping (don't throw these away)

- **SSR + prerender of every canonical route** (`react-router.config.ts:5-11`), per-route meta and canonicals (`src/seo/meta.ts`), and Person JSON-LD (`src/seo/structuredData.ts:14-21`). All text is in the HTML, which is the SEO baseline for everything in Part B.
- **A11y plumbing:** skip link (`src/shell/SkipLink.tsx`), named nav landmarks (`Sidebar.tsx:29-31`, `BottomNav.tsx:9-11`), route focus to the H1 (`src/shell/RouteFocus.tsx:12-24`), a visible 2 px focus ring (`base.css:59-64`), and global reduced-motion handling (`base.css:100-121`). The focus ring renders well (`screens/desktop-home-focus-tab4.png`).
- **Typed content with sources** (`src/content/portfolio.ts`, `validate.ts`), outcome analytics (`src/analytics/outcomes.ts`), and per-route OG cards (`public/social-cards/`).
- **The Career Mix reducer** (`src/career-mix/reducer.ts`). It is a working, testable playback state machine, and the right engine for a real player.

## A1. Global identity: typography, color, copy, art

**Typography (Archivo + IBM Plex Mono): not Spotify-like.** Spotify uses one warm grotesque-geometric family (Circular until 2024, now Spotify Mix by Dinamo) at 400/700/900, sentence case, and never monospace.

- **IBM Plex Mono is the "terminal / audit log" voice.** It is used for eyebrows, stats, sources and dates on every surface (`base.css:73-78` `.evidence-metadata`; `tokens.css:68`; e.g. `RecruiterHero.tsx:75,94,101`, `ProofTrackRow.tsx:19,25,44,52`, `CaseStudyHeader.tsx:22,28,38`). The hero stat "500+ résumés" in green mono (`screens/desktop-home-fold.png`) looks like CLI output.
- **UPPERCASE letter-spaced eyebrows** (`tracking-[0.18em]` at `RecruiterHero.tsx:75`, `ArtistPage.tsx:69`, `CaseStudyHeader.tsx:22`; `uppercase tracking-wide` at `ReleaseCard.tsx:22`, `MediaCard.tsx:37`, `PlaylistPage.tsx:35`). Spotify labels are small sentence case ("Playlist", "Public Playlist", "Song").
- **Archivo at 900 with −0.035em tracking** (`RecruiterHero.tsx:78`, `ArtistPage.tsx:72`) is an editorial poster face with industrial width. It is closer to a magazine than to Circular or Spotify Mix's round, friendly forms.
- **Covers render in Arial and Courier**, because the SVGs are loaded via `<img>` (`src/shell/Art.tsx:35-46`) and declare `font-family="Arial"` / `monospace` (`public/artifacts/experience.svg`). Three typefaces collide on one card (`screens/desktop-home-hover-card-scrolled.png`).
- **No tabular figures on time-like data** outside the mono class. Durations and dates won't align once they move to a sans face.

**Color:**

- **A single accent.** Everything is `#1b1b1b` + `#303030` borders + green (`tokens.css:4-10`). There is no per-release color. Collection `gradient` values exist in content (`portfolio.ts:666-717`) but appear only as image fallbacks (`Art.tsx:30-33`) and as a scroll tint (`TopBar.tsx:6-14,27-28`), never as the page header color. Spotify's signature is the artwork color bleeding into the header.
- **Borders everywhere** (`border border-line` on the hero, cards, rows, search results, related cards and filter panel; e.g. `RecruiterHero.tsx:68`, `ProofTrackRow.tsx:16`, `ReleaseCard.tsx:14`, `Library.tsx:95`). Spotify separates almost nothing with borders; it uses tint, spacing and shadow. The 1 px `#303030` outline is the single most "not Spotify" texture on screen.
- **Warm off-white text `#f7f7f5`** (`tokens.css:8`) instead of Spotify's pure `#fff`. It is subtle, but on black it reads as paper, not app.
- **One recycled green radial glow** (`RecruiterHero.tsx:70`, `ArtistPage.tsx:66`) stands in for "atmosphere" on every hero.

**Copy voice: defensive and bureaucratic.**

- **Content strings:** "The résumé reports …" opens seven results (`portfolio.ts:56,90,117,168,237,284,322`), "Date not listed in résumé" appears three times (`portfolio.ts:259,278,296`), and "Résumé-listed …" recurs (`:262,281,298,317`).
- **UI strings:** "Recruiter briefing" (`RecruiterHero.tsx:76`), "Professional collection" (`PlaylistPage.tsx:36`, `LikedSongs.tsx:34`), "Evidence in this collection" (`PlaylistPage.tsx:65`), "Strongest sourced result" (`CaseStudyHeader.tsx:48`), "Self-reported evidence: this artifact is candidate-provided and has not been independently verified" (`EvidencePanel.tsx:19-21`), "Current availability is not stated in the candidate-provided résumé" (`ArtistPage.tsx:246`).
- **The worst offender:** "Spotify-style releases remain a secondary wayfinding cue" (`src/pages/Library.tsx:90-91`). The UI tells the visitor the theme is secondary. **Delete.**
- **Bad value formatting:** the formatter emits "**10 top percent**" and "**4 position**" (`src/content/waveform.ts:20-24` with units at `portfolio.ts:543,606`), while the cover art says "TOP 10%". The same fact is spelled two ways, and both read awkwardly.

**Art direction:**

- **Every cover is the same composition:** black field, 18 px green bar, mono label (`EvidenceCover.tsx:72-152`, `public/artifacts/*.svg`). At sidebar size (44 px) they become illegible grey smudges (`screens/desktop-artist-fold.png`, left rail). On Spotify, artwork is the primary navigation affordance, and here it carries no information.
- **No human:** there is no photo of Darshil anywhere. `src/assets/hero.png` is the unused Vite starter graphic. A Spotify Artist page without an artist image is the biggest single gap on `/artist`.

## A2. Shell

### Frame and main view (`src/shell/AppShell.tsx`)

- `h-screen` (100vh) and `body { overflow: hidden }` (`AppShell.tsx:21`, `base.css:43`) mean the app scrolls inside `<main>`. On mobile Safari, 100vh exceeds the visible viewport (tab bar risk), the URL bar never collapses (less immersive), and pull-to-refresh and scroll restoration behave differently. Use `100dvh` and document scroll on mobile.
- `main` keeps `m-2 rounded-lg` at every width (`AppShell.tsx:30`). On phones this is a card-in-a-card with an 8 px black frame (`screens/mobile-home-fold.png`). The Spotify mobile app is edge to edge.
- **Every scroll event re-renders the shell:** `onScroll → setScrollY` in AppShell (`AppShell.tsx:15,29`) re-renders AppShell, Sidebar, TopBar and the route tree per frame, just to fade a header tint. That is an INP and jank risk. Use CSS scroll-driven animation or an IntersectionObserver sentinel instead.
- **No right "Now Playing" panel and no persistent player bar.** Since the 2023 desktop redesign, Spotify always shows Library left, main center, Now Playing right, and the player bottom. Two of those four pillars are missing.

### Left panel (`src/shell/Sidebar.tsx`)

- **Pre-2024 layout:** a separate Home/Search card above the library (`Sidebar.tsx:34-51`). Current Spotify moved Home and Search into a global top bar; the left panel is only "Your Library".
- **Labels:** "Overview" instead of Home (`:45`), and "Portfolio" as a non-link header (`:55-57`) instead of "Your Library". "Candidate profile / Profile" (`:71-74`) should be "Darshil Jain · Artist". Six rows share the subtitle "**Portfolio collection**" (`:112`). Spotify rows read "Playlist • Owner", "Artist", "Album • Artist".
- **Missing:** filter chips (Playlists / Albums / Artists), library search, sort ("Recents"), list/grid toggle, a pinned Liked Songs row, a green "now playing" speaker on the active item, collapse to a 72 px rail, and resizing.
- **Fixed width:** `w-56` = 224 px, not resizable (`:31`). Spotify's library is roughly 280–420 px and collapsible.
- **CTAs stacked in the library.** Three full-width pills (Download CV / Email / LinkedIn) are pushed under the list on non-home routes (`:117-121`). They compete with the list and look like a SaaS sidebar (`screens/desktop-pl-projects-fold.png`).
- **Wordmark:** the all-caps "DARSHIFY" wordmark (`:41`) is fine as a brand, but it sits in a card instead of the top bar.

### Top bar (`src/shell/TopBar.tsx`)

- **Back/forward:** the arrows are text glyphs "‹ ›" (`:35,42`), not chevron icons. Forward also shows on mobile, where Spotify shows only a contextual back.
- **No global search field.** In Spotify's centered pill search ("What do you want to play?") is the most-used control. Here search is a separate page with a four-block form (`src/pages/Search.tsx:16-25`, `src/components/SearchField.tsx:10-18`).
- **Fake avatar:** the "D Darshil" chip is a `<span>` styled like a button (`:49-54`), so it has the affordance with no action, and it is hidden below `lg`. Spotify's avatar opens the account menu, which is the natural home for CV / Email / LinkedIn / Share.
- **The scroll tint is the only "dynamic color"** (`:20,27-28`), and on Home it fades to `#0d0d12` (`:28`). No title or mini play button appears in the sticky bar on scroll, which is a key Spotify playlist behavior.

### Player: the Career Mix dock (`src/career-mix/CareerMixDock.tsx`)

- **Bug:** the play/pause control is blank. `controlClass` contains `text-white` and the toggle appends `bg-white text-black` (`:19-20,97`); white wins, so it computes to white on white. This fails WCAG 1.4.11 (1:1) and makes the most important control invisible (`screens/desktop-home-careermix-open.png`, `screens/mobile-home-careermix-open.png`). **Rule:** never combine conflicting utilities. Give the player button its own class.
- **Inverted anatomy:** text on the left, scrubber in the middle with "Evidence: …" above it, transport on the **right** (`:45,81-120`). Spotify centers the transport above the scrubber, puts art + title + like on the left, and utilities on the right. There is no artwork thumbnail, no like, and no times on both sides of the bar.
- **Fake details:** the duration is hard-coded "**/ 1:00**" (`:65`), the progress is a non-seekable `<progress>` (`:68-78`), and the label "Chapter 1 of 3" is in mono (`:47-49`).
- **It exists only after a click** (`:27`). Spotify's bar is always present; idle, it shows the last or suggested track.
- **On mobile it's a 215 px slab** above a 61 px tab bar, a third of the screen (measured), instead of Spotify's 56 px floating mini-player that expands to a full-screen player.
- **Nothing else reacts to playback:** no green now-playing row, no equalizer, no state change on the playlist play button (`PlaylistPage.tsx:53-57` never passes `playing`; `src/shell/PlayButton.tsx:4`), and no document-title change.
- **Context mismatch:** pressing ▶ on _Education_ or _Achievements_ starts the same Operate/Analyze/Lead mix (`PlaylistPage.tsx:56`, `LikedSongs.tsx:53`, `portfolio.ts:721-740`). On Spotify, play plays _this_ list.

### Mobile tab bar (`src/shell/BottomNav.tsx`)

- **Flat black with a 1 px top border** (`:11`). Spotify uses a black gradient fade so content dissolves under the bar, with no border.
- **Labels "Overview" / "Portfolio"** (`:14,20`) where Spotify uses Home / Search / Your Library.
- **No `env(safe-area-inset-bottom)` padding,** and the viewport meta lacks `viewport-fit=cover` (`app/root.tsx:55`).
- **The mini player isn't integrated;** the dock stacks on top as a separate slab.

### Toasts (`src/shell/Toast.tsx`)

- **Dead code:** `ToastProvider` is mounted but `useToast` has **zero consumers**, so actions like download, copy link or like give no feedback.
- **If used,** it has no `aria-live` (`:19-27`), is a green pill (Spotify toasts are compact cards above the player), and has inline `<style>` keyframes (`:29`).

## A3. Shared components

- **Shelves** (`src/shell/Shelf.tsx`): a 1/2/3-column grid of giant cards (`:43`) instead of a single row of ~180 px cards (desktop) or a horizontal carousel (mobile). Descriptions sit under every shelf title (`:38-42`). The result is a 5,751 px mobile Home.
- **Media cards** (`src/shell/MediaCard.tsx`): permanent `bg-card p-4` (`:28`), mono eyebrow (`:36-40`), 3-line clamp (`:43`), and an underlined "Read case study" text CTA (`:46-49`). There is no hover play button. Alt text duplicates the title (`:33`), so screen readers hear every title twice.
- **Release cards** (`src/components/ReleaseCard.tsx`): "Professional category" eyebrow on every card (`:22-24`), themed label in mono (`:28-30`), and "Explore collection" CTA text (`:34-36`). There are six identical black covers in a row (`screens/desktop-search-fold.png`).
- **Proof track rows** (`src/components/ProofTrackRow.tsx`): a bordered `<article>` card about 222 px tall (`:16`) with a zero-padded mono index "01" (`:17-22`), a kind eyebrow, a bold takeaway, "Outcome:", and a right column of Source / status / "Read case study" (`:43-71`).
  - No column header and no hover play swap; the only hover change is the border color (`screens/desktop-projects-hover-row.png`).
  - The whole row isn't clickable; only the small link is.
  - Rows without a number print "**Résumé-listed evidence**" in green where a metric should be (`:45`).
- **Proof waveform** (`src/components/ProofWaveform.tsx`): three points joined by a line is a sparkline, not a waveform. On `/artist` the path drops to the baseline at both ends (`:30-34`), which renders as vertical spikes that look like a broken chart (`screens/desktop-artist-full.png`). It isn't a Spotify concept, and in its current form it adds noise.
- **Play button** (`src/shell/PlayButton.tsx`): no `type="button"` (`:15`), and no wiring to playback state anywhere it's used.

## A4. Pages

### Home (`/`; `src/pages/Home.tsx`, `src/components/RecruiterHero.tsx`)

- **A briefing card, not a Home feed.** It is a bordered "Recruiter briefing" card (`RecruiterHero.tsx:66-139`) with a mono stat, four equal-weight pills (CV / Email / LinkedIn / Start Career Mix, `:114-125`) and a sparkline. Spotify's Home is a greeting, filter chips, an 8-tile quick-pick grid with hover-driven background color, and shelves.
- **The greeting is hidden** (`sr-only`, `RecruiterHero.tsx:74`). It is also computed in the route loader (`app/routes/home.tsx:6-8`), and because the route is prerendered, that runs at **build time**, so the greeting is frozen to the build hour.
- **The hero's right column is unreadable:** a cover with ~6 px text plus a "row" cover (`:132-137`). On mobile it is absolutely positioned over the H1 (overlap measured above).
- **The shelves repeat themselves:** the "Recruiter Essentials" and "Evidence collections" covers duplicate each other ("Figmenta 500+ résumés", "IIM Calcutta 4 position", "TOP 10%" each appear twice; `screens/desktop-home-full.png`).

### Artist (`/artist`; `src/pages/ArtistPage.tsx`)

- **No banner image, no listener line, no Popular list, no Discography shelf, no Follow button.** The hero is the same bordered card with a green radial (`:62-139`); the cover is hidden on mobile (`:135`).
- **"Selected Impact" uses the 222 px card rows** (`:141-158`) where Spotify shows "Popular" in 56 px rows.
- **"Proof Waveform" is its own section** (`:160-172`), presented like a data-viz panel.
- **"Career Releases" is six identical black cards in a grid** (`:174-184`).
- **"About" repeats the hero summary verbatim** (`:191-193` vs `:78-80`).
- **The page ends with self-defeating copy.** "Availability … not stated in the candidate-provided résumé" (`:235-250`) is followed by a duplicate contact block, "Encore" (`:252-267`).

### Playlists (`/playlist/{experience,projects,skills,certs,achievements,education}`; `src/pages/PlaylistPage.tsx`) and Liked (`/liked`; `src/pages/LikedSongs.tsx`)

- **Flat grey header** (`bg-elevated`, `PlaylistPage.tsx:27`, `LikedSongs.tsx:25`) where Spotify uses an artwork-colored gradient. The cover is the black/green template with micro-text.
- **Eyebrow and meta in mono:** "Professional collection" (`:35-37`) and "Case-study LP · 4 evidence items" (`:44-48`) replace "Playlist" and "Darshil Jain • 4 songs, 11 mo".
- **Bare action bar:** a lone 56 px play button (`:52-58`) with no shuffle / save / download / more and no list-view toggle.
- **A redundant H2,** "Evidence in this collection" (`:60-66`), then card rows.
- **The Skills page lists no skills.** `/playlist/skills` shows eight case studies (`screens/desktop-pl-skills-full.png`); skills appear only as chips on `/artist` and in search. "Skills = genres" is the most natural Spotify mapping, and it's missing.
- **Duplicate content:** `/liked` and `/playlist/achievements` render the same four items under two titles, each with a self-canonical tag (curl). Two indexable URLs serve one page.
- **The Liked page doesn't use the Liked Songs visual** (gradient + heart cover).

### Case study (`/case-studies/:slug`; `src/pages/CaseStudyPage.tsx`, `CaseStudyHeader.tsx`, `EvidencePanel.tsx`)

- **A report document, not a Song page.** It has a giant title, mono byline, "Recruiter takeaway" and "Strongest sourced result" boxes, then the H2s Situation / Action / Result / Evidence / Skills / Related / Start a conversation (`CaseStudyPage.tsx:66-199`). There is no cover, color, play, lyrics or artist card.
- **The content column is capped at 760 px and left-aligned** (`:74`) inside a 1,200 px article. At 1440 about 40 % of the main panel is empty (`screens/desktop-cs-figmenta-fold.png`).
- **The "SOURCE ARTIFACT" box is a fake image:** a 16:9 black SVG with the text "Darshil Jain résumé PDF / document · direct source / self-reported" (`EvidencePanel.tsx:39-87`). Next to it is the "not been independently verified" disclaimer (`:16-23`).
- **Bug:** "Back to Projects" is hard-coded on every case study, including experience, leadership and achievements (`CaseStudyPage.tsx:192-197`).

### Search (`/search`; `src/pages/Search.tsx`, `SearchField.tsx`, `SearchResults.tsx`)

- **Four text blocks before the input** (eyebrow, H1, paragraph, label + hint; `Search.tsx:16-25`, `SearchField.tsx:10-18`).
- **Off-white input** (`bg-text text-ink`, `SearchField.tsx:29`). The desktop Spotify search is dark `#1f1f1f`; a white field is the mobile-app style.
- **Two clear buttons:** the native `type="search"` ✕ and a custom "Clear" pill (`:23,31-38`; `screens/desktop-search-query-fold.png`).
- **Browse grid:** six identical black release cards (`Search.tsx:57-60`) instead of colorful tilted-art genre tiles.
- **Results:** large 2-column cards with "Read case study" (`SearchResults.tsx:35-61,113`). There is no "Top result" card, no "Songs" list with art, no filter chips, and no Artists or Genres rows.
- **Every skill chip links to `/playlist/skills`** regardless of the skill (`SearchResults.tsx:131-133`), so the chips are dead ends.
- **The query lives in `useState`** (`Search.tsx:9`). It can't be shared or bookmarked and is invisible to crawlers.

### Library (`/library`; `src/pages/Library.tsx`)

- **A form, not a library.** It has a fieldset/legend "Filter evidence categories", 44 px chips, a labelled search input, and a native `<select>` "Sort releases" (`:95-159`). Mono counters follow (`:161-166`).
- **It renders the same giant cards again.** Spotify's mobile library is a dense list of 64 px rows with 32 px chips and a "Recents" sort.
- **The meta-copy undermining the theme is here** (`:90-91`, see A1).

### 404 (`src/pages/NotFound.tsx`)

- It is fine structurally, but the copy ("evidence page", `:12`) and the second CTA, "Browse Projects", are off-tone. Spotify's 404 is a centered mark, "Page not found", a "Home" button and a help link.

## A5. Accessibility (beyond A2–A4)

- **WCAG 1.4.11 fail:** the invisible Career Mix toggle (A2).
- **Target-size policy is blunt.** `:where(a,button,…){min-block-size:44px;min-inline-size:44px}` (`base.css:54-57`) inflates every inline link and makes dense Spotify layouts impossible: 56 px rows with 32 px icon buttons, and 32 px chips. WCAG 2.2 AA requires **24×24** (2.5.8); 44 is AAA. Keep 44 for `(pointer: coarse)` and allow 32–40 px visual controls with ≥24 px hit areas on desktop.
- **Duplicate announcements:** cover `alt={title}` sits next to the visible title (`MediaCard.tsx:33`).
- **Hero overlap on mobile** (`RecruiterHero.tsx:75,132`). The eyebrow gets `pr-24`, but the H1 doesn't.
- **Toasts have no live region** (`Toast.tsx:19`). The skills search results misrepresent their destination (`SearchResults.tsx:131-136`: the label says "Explore Excel" but it goes to the generic skills page).
- **Good:** route focus, skip link, landmarks, labelled inputs, `aria-live` on search counts (`SearchResults.tsx:96-103`), status messages in the dock (`CareerMixDock.tsx:123-130`), and the reduced-motion global (`base.css:100-121`).

## A6. Responsive

- **Mobile is a shrunken desktop:** inset panel, ‹ › circles, 600 px cards stacked vertically, CV/Email/LinkedIn icon buttons in the top bar (`TopBar.tsx:44-48`; `screens/mobile-artist-fold.png`), and a 33 % chrome slab while playing.
- **Tablet (820 px):** the 224 px sidebar plus a 2-column grid of 270 px cards (`screens/tablet-home-fold.png`). The avatar chip disappears below `lg` (`TopBar.tsx:49`). Spotify at this width collapses the library to a 72 px rail.
- **No horizontal overflow anywhere** (good). Nothing truncates essential titles.

## A7. Motion

- **The only motion:** a 0.7 s path draw on the sparkline (`ProofWaveform.tsx:86-88`), a 200 ms dock rise (`CareerMixDock.tsx:40-42`), `scale-[1.02]` on pills (`ContactActions.tsx:24`), and background-color hovers. There is no play-button rise on cards, no header color crossfade, no equalizer, no shared-element transition between card and header, and no sticky-header morph.
- **Reduced motion is respected globally** (`base.css:100-121`). Keep that pattern.

## A8. SEO and performance notes that matter for the redesign

- **Duplicate pages:** `/liked` vs `/playlist/achievements` (A4).
- **Search state isn't in the URL.**
- **Stale greeting:** computed at build time (A4 Home).
- **Weight is lean today:** two fonts total 50 KB (Archivo 35 KB + Plex Mono 15 KB) and covers are about 1.6 KB SVGs. The redesign will add real artwork and a photo, so budget for AVIF/WebP variants. `sharp` is already a devDependency, used by `scripts/generate-social-cards.ts`.

## A9. Top 10 illusion-breakers (ranked by how fast they break the "I'm in Spotify" feeling)

1. **No persistent player bar, and the one that appears is broken.** The dock appears only after a click, has inverted anatomy (transport on the right), a blank white play button, a fake "/ 1:00" duration, and a 215 px slab on mobile. _(AppShell.tsx:39; CareerMixDock.tsx:19-20,45,65,97)_
2. **Monochrome, identical text-only covers.** Black field, green bar and Courier text on every release; illegible at 44 px; the same "Figmenta" cover repeated. Spotify is a mosaic of colorful square art. (`EvidenceCover.tsx:72-152`; `public/artifacts/*.svg`)
3. **Terminal typography.** IBM Plex Mono stats and labels, UPPERCASE tracked eyebrows, and Archivo poster headlines, with Arial/Courier inside covers. _(tokens.css:67-68; base.css:73-78; RecruiterHero.tsx:75)_
4. **Report and disclaimer voice.** "Recruiter briefing", "Professional collection", "Evidence in this collection", 10× "self-reported" on one page, "Date not listed in résumé", "The résumé reports…", "Spotify-style releases remain a secondary wayfinding cue". _(portfolio.ts:56-322; EvidencePanel.tsx:19-21; Library.tsx:90-91)_
5. **Card-stack "tracks".** Bordered rows about 222 px tall with Source/status columns instead of a 56 px track table with #/Title/Album/Date/Duration, hover play-swap and a green now-playing state. _(ProofTrackRow.tsx:16-72)_
6. **No artwork-driven color.** Release headers are flat `#1b1b1b`; every hero gets the same faint green radial. _(PlaylistPage.tsx:27; LikedSongs.tsx:25; RecruiterHero.tsx:70)_
7. **Outdated, incomplete shell.** Separate Home/Search card, no centered top-bar search, a fake avatar, no right Now Playing panel, a library without chips/sort/grid/collapse, and CTA pills stacked in the library. _(Sidebar.tsx:34-57,117-121; TopBar.tsx:30-54)_
8. **Home isn't Spotify Home.** A bordered briefing card with a sparkline, a hidden greeting, no quick-pick grid, and shelves as 3-column grids of giant cards with descriptions and underlined CTAs. _(RecruiterHero.tsx:66-139; Shelf.tsx:38-45; MediaCard.tsx:28-49)_
9. **Artist and case-study pages are documents.** No banner photo, listener-line slot, Popular list or Discography; case studies are Situation/Action/Result memos with a fake "SOURCE ARTIFACT" image instead of Song pages with lyrics and credits. _(ArtistPage.tsx:62-267; CaseStudyPage.tsx:66-199; EvidencePanel.tsx:39-87)_
10. **The mobile shell isn't the Spotify app.** Inset rounded panel, ‹ › circles, 10 full-width stacked cards (5,751 px Home), 33 % player chrome, hero name under the cover, "Overview/Portfolio" tabs, and no mini-player or full-screen player. _(AppShell.tsx:21,30; BottomNav.tsx:11-21; RecruiterHero.tsx:132)_

Honorable mentions: the white search field with a double clear and no `?q=`, the Library-as-form page, dead toasts, and the "Back to Projects" bug.

---

# Part B: Recommendations

## B1. North star: honest fidelity

**Rebuild Darshify as a faithful music-streaming app whose every slot holds a true fact.**

- **No fabrication:** never fake listeners, plays, a verified tick or audio. Use Spotify's slots for real data instead: the listener line becomes real counts, the plays column becomes measured impact, "date added" becomes the real period, and duration becomes the real engagement length.
- **Provenance moves into Spotify's own vocabulary.** It goes into **Credits**, a "Source" row reading _Darshil Jain résumé (PDF)_, and one site-level liner note, instead of disclaimers on every card.

The theme is now the information architecture. Recruiter conversion stays one click away everywhere: the avatar menu, the artist action bar, the player's download icon, and the track page.

> **Conflict to surface in Phase 2.** The previous research and synthesis (`research/00-synthesis.md` insights 1, 3 and 4) said "Spotify becomes the presentation grammar, not the IA" and "the full queue/shuffle/repeat… should not remain by default". The owner's new brief reverses that. My proposal for resolving it is honest fidelity: full Spotify IA and controls, every control real, every number sourced. That needs an explicit user decision.

## B2. Spotify anatomy to emulate (desktop web player and mobile app, 2025–26)

Hex values and pixel sizes are observed approximations of the live product (third-party reconstructions in the sources agree). Verify them in DevTools on open.spotify.com before pixel-locking. Use original icons and fonts (see B11).

### Desktop web player

**Frame**

- App canvas `#000` with 8 px padding and 8 px gaps between panels.
- Panels are `#121212` with 8 px radius and scroll independently.
- Grid rows: global top bar 64 px, then the panels, then a 72 px player bar.

**Global top bar (64 px)**

- **Left:** the logo; the desktop app places back/forward chevrons near it.
- **Center:** a 48 px round **Home** button (bg `#1f1f1f`, icon `#b3b3b3`, white and filled when active, hover `scale(1.04)`) next to a **48 px pill search field** (bg `#1f1f1f`; hover `#2a2a2a` + 1 px `rgba(255,255,255,.1)` ring; focus 2 px white ring; magnifier left; placeholder "What do you want to play?"; divider + Browse icon on the right).
- **Right:** a white "Explore Premium" pill, "Install app", What's New (bell), Friend Activity, and the avatar (32 px in a 48 px `#1f1f1f` circle) that opens the account menu.

**Your Library (left, resizable ~280–420 px, collapsible to a 72 px art-only rail)**

- **Header:** "Your Library", a "+ Create" pill and an expand arrow.
- **Filter chips:** 32 px pills, 14 px text, bg `rgba(255,255,255,.07)`, hover `.1`; selected is white bg with black text plus an ✕ chip to clear. Labels: Playlists / Artists / Albums / Podcasts.
- **Toolbar:** search-in-library icon, a "Recents ▾" sort (Recents, Recently added, Alphabetical, Creator), and a view toggle (Compact / List / Grid).
- **Rows:** 64 px tall, 8 px padding, 6 px radius, hover `rgba(255,255,255,.07)`.
  - **Art:** 48 px, 4 px radius; artists are round.
  - **Title:** 16 px white, **green while playing**.
  - **Subtitle:** 14 px `#b3b3b3`, "Playlist • Owner" with a green pin icon.
  - **Now-playing indicator:** a green speaker glyph at the right edge of the playing row.

**Main view: Home**

- Sticky chips (All / Music / Podcasts).
- **Greeting:** the classic "Good morning / afternoon / evening" heading (≈32 px/700) above the quick picks. Recent builds lead with the chips instead, but the greeting is still one of the most recognizable cues. Darshify should show it visibly, rendered client-side (B9), followed by the chips.
- **Quick-pick grid:** 8 items, 2 rows × 4 on wide screens, each 64 px with art flush left, a bold title, bg `rgba(255,255,255,.1)` (hover `.2`), and a 48 px green play that fades in at the right.
- **The page-top gradient takes the color of the hovered quick pick** and crossfades over about 0.5 s. This is the most "alive" part of Spotify.
- **Shelves:** title 24 px/700 (a link), "Show all" 14 px/700 `#b3b3b3` on the right, one row of ~180 px cards that never wraps (mobile scrolls horizontally).
- **Cards:** 12 px padding, transparent until hover (`#1f1f1f`). Art is 1:1 with a 6 px radius (round for artists) and `0 8px 24px rgba(0,0,0,.5)`; title 16 px, 1 line; subtitle 14 px `#b3b3b3`, 2 lines.
- **Card hover:** a **48 px green play button rises 8 px and fades in** at the art's bottom-right, about 300 ms, with shadow `0 8px 8px rgba(0,0,0,.3)`.

**Main view: playlist, album or EP**

- **Header:**
  - **Background:** solid **artwork color** with `linear-gradient(transparent, rgba(0,0,0,.5))`.
  - **Art:** ~232 px, `0 4px 60px rgba(0,0,0,.5)`.
  - **Type label:** "Playlist" / "Album" / "EP", 14 px.
  - **Title:** up to 6rem/900 at −0.04em, auto-shrinking for long names.
  - **Description:** 14 px at 70 % white.
  - **Meta line:** 24 px owner avatar + **owner** • saves • "N songs, about X hr".
- **Body background:** same color + `linear-gradient(rgba(0,0,0,.6) 0, #121212 232px)`.
- **Action bar:** **56 px green play**, shuffle, save (+), download, more (…); "List ▾" on the right.
- **Track table:**
  - **Header row:** sticky under the top bar, 14 px `#b3b3b3` labels "#", Title, Album, Date added, clock icon, with a 1 px `rgba(255,255,255,.1)` rule.
  - **Columns:** `[16px] 6fr 4fr 3fr minmax(120px,1fr)`, 16 px gap.
  - **Rows:** **56 px**, 4 px radius.
    - **Hover:** bg `rgba(255,255,255,.1)`; the number swaps to ▶, and ♡/+ and … appear.
    - **Selected:** bg `rgba(255,255,255,.3)`.
    - **Now playing:** the number becomes a **green animated equalizer** and the title turns `#1ed760`.
  - **Cell content:** a 40 px art thumbnail + title (16 px white) over the artist line (14 px `#b3b3b3`, underline on hover).
- **Sticky header morph:** when the big title scrolls away, the top bar fills with the artwork color and shows a small green play button and the title.

**Artist page**

- **Header:** a full-bleed banner photo, ~40 vh (min 340, max 500), darkening toward the bottom. A "Verified Artist" badge, the name at 6rem/900, and a "N monthly listeners" line.
- **Action bar:** play, shuffle, an outlined **Follow** pill (32 px, 1 px `#7c7c7c` border, hover white + scale), and ….
- **Popular:** 5 rows (#, 40 px art, title, plays, duration) with "See more".
- **Artist pick** card, then **Discography** with chips (Popular releases / Albums / Singles and EPs) and a card row.
- **Further shelves:** "Featuring", "Fans also like", "Appears on".
- **About:** a big image card with listeners and a bio excerpt; it opens a modal with a gallery and links.

**Now Playing view (right, resizable ~280–420 px)**

- **Header:** context name ("Liked Songs") + … + ✕.
- **Art:** full panel width with an 8 px radius. A **Canvas** looping video replaces the art and fills the panel when present.
- **Track info:** title 24 px/700 with share and +, then the artist.
- **Stacked `#1f1f1f` cards** (8 px radius, 16 px padding): _About the artist_ (image, listeners, 3-line bio, Follow), _Credits_ (name + role rows, "Show all"), _On tour_, and _Next in queue_ (one row + "Open queue").

**Player bar (72 px, bg `#000`)**

- **Left 30 %:** 56 px art, title 14 px (a link), artist 12 px `#b3b3b3`, and a save +/✓ (green when saved).
- **Center 40 % (max ~722 px):** shuffle / prev / **32 px white circle play (black icon)** / next / repeat. Active toggles are green with a 4 px dot.
- **Scrubber below the transport:** times 12 px tabular `#b3b3b3`; a 4 px bar on `#4d4d4d`. The fill is white and **turns green on hover, when a 12 px white knob appears**.
- **Right 30 %:** Now Playing view, Lyrics (mic), Queue, Connect to device, volume icon + ~93 px slider, Miniplayer, Full screen.

**Lyrics view**

- The main panel takes the track's color.
- Lines at about 2rem/700.
- **The active line is white**; past lines are lighter; upcoming lines are dark; clicking a line seeks; it auto-scrolls smoothly.

**Search**

- Typing in the top-bar field opens the results view.
- **Chips:** All / Songs / Artists / Playlists / Albums / Genres.
- **"Top result":** a big card with 92 px art and a 32 px title, plus "Songs" (4 rows) beside it, then Artists (round) and Albums shelves.
- **Empty state, "Browse all":** a grid of colored tiles (8 px radius) with a bold title top-left and artwork **rotated 25° and clipped** at the bottom-right.

**Toasts, menus, tooltips and shortcuts**

- **Toast:** a compact rounded notice centered just above the player ("Added to Liked Songs", optionally with "Change").
- **Context menu:** right-click or the … button. Bg `#282828`, 4 px radius, 4 px padding; items 40 px with 14 px text and 16 px icons; hover `rgba(255,255,255,.1)`; submenus; shadow `0 16px 24px rgba(0,0,0,.3), 0 6px 8px rgba(0,0,0,.2)`.
- **Tooltip:** `#282828`, 14 px, 4 px radius.
- **Keyboard shortcuts:** Space for play/pause, quick search, like, next/prev and seek, plus a shortcuts sheet opened from the account menu or a key combo.

### Mobile app (iOS/Android)

**Tab bar and mini player**

- **Tab bar:** Home / Search / Your Library (+ Premium or Create) with 24 px icons and ~10–11 px labels. It sits on a **black gradient fade with no border**, so content dissolves beneath it.
- **Mini player:** floats above the tab bar. It is 56 px tall with an 8 px side inset and 6–8 px radius, its **background is the artwork color**, and it holds 40 px art, title/artist, device, +, and play/pause, with a 2 px progress line along the bottom edge.
- **Tapping the mini player expands the full-screen player:**
  - **Top:** a drag-down chevron and "Playing from playlist / Liked Songs".
  - **Middle:** big art or a full-bleed Canvas, title 22 px + artist, + / ✓, the scrubber, and the transport with a 64 px white play.
  - **Bottom row:** device, share, queue.
  - **Scroll down:** a **Lyrics card**, _About the artist_, and _Credits_.

**Home**

- A 32 px avatar (opens a side drawer) + chips.
- A **2-column quick-pick grid** of 56 px tiles.
- Horizontal shelves of ~150 px cards with titles at 22–24 px/700.

**Playlist**

- An artwork-color gradient header and a **centered cover** (~60 % width).
- The title left-aligned, then the owner row and meta.
- An action row: + / download / … on the left, shuffle + 48–56 px green play on the right.
- 56 px rows with 48 px art and a … menu.

**Search**

- A "Search" title and a **white** 48 px input ("What do you want to listen to?").
- A 2-column grid of rotated-art genre tiles.

**Your Library**

- Avatar + title + search and + icons, then chips, "Recents" + a grid toggle, and dense rows.

### Wrapped (story mode)

- 9:16 full-bleed slides with segmented progress bars along the top.
- Tap left or right to navigate, hold to pause, ✕ to close.
- Bold kinetic typography, big numbers, and color shapes.
- A final **share card**.

## B3. Mapping Darshil's portfolio onto Spotify surfaces

| Portfolio concept                                    | Spotify surface                                                                                                                                                                                      | Route (keep existing URLs)                                 | Honest data in each Spotify slot                                                                                                                                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Darshil                                              | **Artist**                                                                                                                                                                                           | `/artist`                                                  | **Banner:** real photo (needed). **Badge slot:** "Open to roles" or "BBA ’27" chip, _not_ a verified tick. **Listener line:** "3 internships · 4 projects · 4 recognitions", computed from content. **Follow:** opens LinkedIn. **…:** Download CV / Email / Copy link |
| Darshil's top work                                   | **Popular** (top 5 on the artist page)                                                                                                                                                               | `/artist`                                                  | Plays column → **Impact** ("500+ résumés screened"); duration → engagement length ("2 mo")                                                                                                                                                                             |
| Latest role                                          | **Artist pick**                                                                                                                                                                                      | `/artist`                                                  | "Latest release: Operations Intern at Figmenta · Jan 2026"                                                                                                                                                                                                             |
| Internships (Figmenta, PSR, MJ)                      | **EP "Experience"**, each internship a **track**                                                                                                                                                     | `/playlist/experience`                                     | Album → organization; Date added → start month; Duration → months                                                                                                                                                                                                      |
| Projects (ZautoAI, Telemedicine, Haldiram's, Zomato) | **Singles** (each with its own cover), gathered in the "Projects" playlist                                                                                                                           | `/playlist/projects`                                       | Album → client or program; Impact where a proof exists, "—" otherwise                                                                                                                                                                                                  |
| Leadership (Igniters Club)                           | **Album** "Igniters Club" (or "Converge, Live")                                                                                                                                                      | the case study, plus Discography                           | "1,000+ participants" in the impact slot                                                                                                                                                                                                                               |
| Skills                                               | **Genres**: Browse-all tiles plus a genre hub page per skill                                                                                                                                         | `/search` (tiles) + **new** `/genre/:skill`                | Each genre page = tracks where the skill was applied. Distinct and crawlable                                                                                                                                                                                           |
| Achievements                                         | **Liked Songs**-styled "Awards" (gradient + glyph cover, pinned first in the Library)                                                                                                                | `/liked` (301 `/playlist/achievements` → `/liked`)         | Date column blank when unknown, never "Date not listed in résumé"                                                                                                                                                                                                      |
| Certifications                                       | **"Credentials" EP** (optionally styled as _Audiobooks / Courses_)                                                                                                                                   | `/playlist/certs`                                          | Issuer as "artist", year as date                                                                                                                                                                                                                                       |
| Education                                            | **Discography → Albums**, the debut releases ("BBA 2024–27", "Senior Secondary 2024")                                                                                                                | `/playlist/education`                                      | CGPA / percentage as the album's impact line                                                                                                                                                                                                                           |
| Each case study                                      | **Song (track) page**: header art + "Song • Darshil Jain • Experience • 2026 • 2 mo", **Lyrics** = Situation → Actions → Result lines, **Credits** = role, team, source, then "More by Darshil Jain" | `/case-studies/:slug` (keep; it is already in the sitemap) | Credits row "Source: Darshil Jain résumé (PDF)" replaces every "self-reported" chip                                                                                                                                                                                    |
| Career Mix                                           | **Playlist playback**: a real 60–90 s queue of tracks driving the player bar, the Now Playing view, lyrics and the green row state                                                                   | global; started from any ▶                                 | Play on a list plays **that** list; the "Career Mix" is the curated cross-list queue                                                                                                                                                                                   |
| Contact                                              | **Follow** (LinkedIn), **Message** (email), **Share** (copy link + toast)                                                                                                                            | action bars + avatar menu                                  | Real outbound links only                                                                                                                                                                                                                                               |
| Résumé                                               | **Download** (the ↓ icon in the action bar and player)                                                                                                                                               | `/Darshil_Jain_Resume.pdf`                                 | Toast: "Downloading Darshil’s CV"                                                                                                                                                                                                                                      |
| Search                                               | **Search** with Top result / Songs / Albums / Genres                                                                                                                                                 | `/search?q=`                                               | Organizations as "Artists" only if they appear as orgs, never as people                                                                                                                                                                                                |
| About                                                | **About card + modal** on the artist page; **About the artist** card in the Now Playing view                                                                                                         | `/artist`                                                  | Bio, education, location; no fabricated counts                                                                                                                                                                                                                         |
| Updates                                              | **What's New** (bell)                                                                                                                                                                                | menu                                                       | "New: Figmenta internship added (Feb 2026)"                                                                                                                                                                                                                            |
| Story                                                | **Wrapped-style story → "Darshify Rewind"** (avoid Spotify's trademarked name)                                                                                                                       | **new** `/rewind`                                          | Real numbers only, with a share card as the OG image                                                                                                                                                                                                                   |

Do **not** fill _Friend Activity_, _Fans also like_ or _monthly listeners_ with invented data. Omit a slot rather than fake it.

## B4. Copy system: replace the disclaimer voice

| Current (file:line)                                                                                                               | Replace with                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Recruiter briefing" (`RecruiterHero.tsx:76`)                                                                                     | Remove. Home opens with the greeting and quick picks                                                                                                          |
| "Professional collection" (`PlaylistPage.tsx:36`, `LikedSongs.tsx:34`)                                                            | "Playlist" / "EP" / "Album" (sentence case, 14 px)                                                                                                            |
| "Case-study LP · 4 evidence items" (`PlaylistPage.tsx:44-48`)                                                                     | "**Darshil Jain** • 2024–2026 • 4 songs, 11 mo"                                                                                                               |
| "Evidence in this collection" (`PlaylistPage.tsx:65`)                                                                             | Remove; the track-table header is enough                                                                                                                      |
| "The résumé reports improved workflow visibility…" (`portfolio.ts:56` and 6 others)                                               | "Improved workflow visibility, on-time task execution and reusable hiring workflows."                                                                         |
| "Date not listed in résumé" (`portfolio.ts:259,278,296`)                                                                          | Leave the date blank; never print a missing date                                                                                                              |
| "Self-reported evidence: … not been independently verified" (`EvidencePanel.tsx:19-21`), plus 5–10 "self-reported" chips per page | One **Credits → Source** row per track ("Darshil Jain résumé (PDF) ↓"), plus one site-wide liner note: "All figures are from Darshil’s résumé, updated 2026." |
| "Résumé-listed evidence" as a metric (`ProofTrackRow.tsx:45`)                                                                     | "—" in the Impact column                                                                                                                                      |
| "10 top percent" / "4 position" (`waveform.ts:20-24`)                                                                             | "Top 10%" / "4th place" (fix the formatter and the units)                                                                                                     |
| "Spotify-style releases remain a secondary wayfinding cue." (`Library.tsx:90-91`)                                                 | Delete                                                                                                                                                        |
| "Current availability is not stated in the candidate-provided résumé." (`ArtistPage.tsx:246`)                                     | "Open to [roles] from [month]" **only if Darshil confirms it**; otherwise delete the section                                                                  |
| "Recruiter takeaway" / "Strongest sourced result" / "Evidence track · experience" (`CaseStudyHeader.tsx:23,39,48`)                | Track header: "Song" label, a takeaway line as the description, the impact stat in the meta line                                                              |
| "Overview" / "Portfolio" (`Sidebar.tsx:45,56`, `BottomNav.tsx:14,20`)                                                             | "Home" / "Your Library"                                                                                                                                       |
| "Candidate profile · Profile" / "Portfolio collection" ×6 (`Sidebar.tsx:72-74,112`)                                               | "Darshil Jain · Artist", "EP • Darshil Jain", "Playlist • Darshil Jain"                                                                                       |
| "Chapter 1 of 3" (`CareerMixDock.tsx:48`)                                                                                         | Now Playing header: "Playing from **Career Mix**"                                                                                                             |
| "Read case study" / "Explore collection" / "Explore evidence" text CTAs                                                           | Remove; the whole card or row is the link (Spotify never prints CTA text on cards)                                                                            |
| Search label + hint + "Try Figmenta, Excel, or strategy" (`SearchField.tsx:14-28`)                                                | Visually hidden label + placeholder "What do you want to explore?"                                                                                            |
| "We couldn't find that evidence page…" (`NotFound.tsx:12`)                                                                        | "Page not found. We can’t find the page you’re looking for." + **Home** + "Search instead"                                                                    |
| "Liner notes / About", "Encore / Start a conversation" (`ArtistPage.tsx:188-190,257-259`)                                         | Spotify's "About" card; contact lives in the artist action bar (Follow / Message / ↓ CV)                                                                      |

## B5. Design tokens

### Font pick: **Figtree (variable, 300–900, SIL OFL)** via `@fontsource-variable/figtree`

**Why Figtree**

- **Closest free shape match.** Spotify Mix (2024, Dinamo) replaced Circular and keeps its friendly geometric-grotesque DNA: round bowls, large x-height, compact spacing, flat terminals. Figtree is a "friendly, simple geometric sans" with exactly those traits and is one of the closest free Circular look-alikes.
- **It has a Black 900.** Spotify's huge titles are 900-weight.
  - Plus Jakarta Sans and Manrope stop at 800 and are more condensed and techy.
  - Inter Tight is accurate but reads "SaaS dashboard".
  - DM Sans (variable, opsz) is the runner-up.
- **It covers what Darshify needs.** One variable file replaces Archivo + Plex Mono (one request instead of two, ~15 KB saved), and Latin-extended covers "résumé".

**Verify before adopting:** check that Figtree ships `tnum` tabular figures. If it doesn't, keep durations and times aligned by right-aligning them in fixed-width cells (`min-width: 3.5ch`), or load Inter Tight for a numeric-only `--font-numeric` token.

**Drop IBM Plex Mono entirely.** Spotify never uses monospace.

### Tokens (Tailwind v4 `@theme`; names avoid clashing with `text-base`)

```css
@import "tailwindcss";

@theme {
  --font-sans:
    "Figtree Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Surfaces */
  --color-app: #000000; /* canvas, player bar, mobile tab bar */
  --color-surface: #121212; /* library, main, now-playing panels */
  --color-surface-hi: #1f1f1f; /* card hover, NP cards, search field, round top-bar buttons */
  --color-surface-2: #2a2a2a; /* field hover; opaque equivalent of row hover */
  --color-menu: #282828; /* context menus, tooltips */
  --color-tint: rgb(255 255 255 / 0.07); /* chips, library row hover */
  --color-tint-hover: rgb(
    255 255 255 / 0.1
  ); /* track-row hover, quick-pick base */
  --color-tint-strong: rgb(255 255 255 / 0.2); /* quick-pick hover */
  --color-selected: rgb(255 255 255 / 0.3); /* selected row */
  --color-divider: rgb(255 255 255 / 0.1);

  /* Content */
  --color-fg: #ffffff;
  --color-subdued: #b3b3b3; /* 8.9:1 on #121212, 6.8:1 on #2a2a2a */
  --color-icon-off: #7c7c7c; /* NON-TEXT only: 4.49:1 on #121212 */
  --color-progress: #4d4d4d;

  /* Signal */
  --color-green: #1ed760; /* 9.8:1 on #121212; black icon on green 10.9:1; never white text on green (1.9:1) */
  --color-green-hover: #3be477;
  --color-green-press: #1abc54;
  --color-negative: #f3727f;
  --color-warning: #ffa42b;
  --color-info: #539df5;

  /* Type scale (Tailwind's text-xs/sm/base stay 12/14/16) */
  --text-display: clamp(
    2rem,
    0.75rem + 5.5cqi,
    6rem
  ); /* needs @container on the header */
  --text-display--line-height: 1;
  --text-display--letter-spacing: -0.04em;
  --text-display--font-weight: 900;
  --text-headline: 2rem;
  --text-headline--line-height: 1.15;
  --text-headline--font-weight: 800;
  --text-title: 1.5rem;
  --text-title--line-height: 1.25;
  --text-title--font-weight: 700;
  --text-lyric: clamp(1.5rem, 1rem + 1.6vw, 2rem);
  --text-lyric--line-height: 1.35;
  --text-lyric--font-weight: 700;

  /* Radii */
  --radius-row: 4px; /* rows, small art, menus, tooltips */
  --radius-art: 6px; /* card artwork */
  --radius-panel: 8px; /* panels, cards, tiles, NP art, mini player */
  /* pills/avatars/play buttons: rounded-full (9999px) */

  /* Shadows */
  --shadow-art: 0 4px 60px rgb(0 0 0 / 0.5);
  --shadow-card: 0 8px 24px rgb(0 0 0 / 0.5);
  --shadow-play: 0 8px 8px rgb(0 0 0 / 0.3);
  --shadow-menu: 0 16px 24px rgb(0 0 0 / 0.3), 0 6px 8px rgb(0 0 0 / 0.2);

  /* Motion */
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --ease-emph: cubic-bezier(0.3, 0, 0, 1);
  --animate-eq: eq 1.1s ease-in-out infinite;
  @keyframes eq {
    0%,
    100% {
      transform: scaleY(0.3);
    }
    50% {
      transform: scaleY(1);
    }
  }
}

:root {
  --topbar-h: 64px;
  --player-h: 72px;
  --panel-gap: 8px;
  --lib-w: 320px;
  --lib-min: 280px;
  --lib-max: 420px;
  --lib-rail: 72px;
  --np-w: 340px;
  --np-min: 280px;
  --np-max: 420px;
  --content-x: 24px;
  --row-h: 56px;
  --row-h-compact: 32px;
  --dur-press: 100ms;
  --dur-hover: 200ms;
  --dur-reveal: 300ms;
  --dur-color: 500ms;
  --dur-story: 700ms;
}
@media (max-width: 767px) {
  :root {
    --content-x: 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-reveal: 0ms;
    --dur-color: 0ms;
    --dur-story: 0ms;
  }
  .eq > i {
    animation: none !important;
    transform: scaleY(0.6);
  }
}
```

**Spacing:** keep Tailwind v4's 4 px base (`--spacing: 0.25rem`) and use only 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px. Fixed rhythm:

- 8 px between panels.
- 16 px panel padding and 24 px main gutters (16 px on mobile).
- 24 px between a shelf title and its cards; 32–48 px between shelves.
- 16 px between table columns.
- Rows at 56 px (32 px compact); Library rows at 64 px.

### Type roles

| Role        | Size / leading              | Weight    | Use                                                                           |
| ----------- | --------------------------- | --------- | ----------------------------------------------------------------------------- |
| `display`   | 2–6rem fluid / 1.0, −0.04em | 900       | H1 on Artist, Playlist, Song and Liked pages (auto-fit; `text-wrap: balance`) |
| `headline`  | 2rem / 1.15                 | 800       | "Your Library", "Search", Rewind numbers (larger)                             |
| `title`     | 1.5rem / 1.25               | 700       | Shelf titles, "Popular", NP track title                                       |
| `base` bold | 1rem                        | 700       | Card titles, quick picks, library row titles (600)                            |
| `base`      | 1rem / 1.5                  | 400       | Track title in rows, body                                                     |
| `sm`        | 0.875rem / 1.45             | 400 / 700 | Subtitles, meta, table cells, chips; buttons, "Show all" and Follow in 700    |
| `xs`        | 0.75rem tabular             | 400       | Player times, tiny badges                                                     |
| `lyric`     | 1.5–2rem / 1.35             | 700       | Lyrics view and Rewind captions                                               |

### States

| Element      | Hover                                                                           | Press                         | Selected / active                                    |
| ------------ | ------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------- |
| Green play   | `bg-green-hover` + `scale-104`                                                  | `bg-green-press` + `scale-96` | Pause glyph                                          |
| Icon buttons | `#b3b3b3 → #fff` + `scale-104`                                                  | `opacity .7`                  | Green + 4 px dot (shuffle/repeat/lyrics/queue)       |
| Rows         | `bg-tint-hover`; number → ▶; ♡ and … shown                                      |                               | `bg-selected`; now playing = green title + equalizer |
| Cards        | `bg-surface-hi`; play rises                                                     | `bg-app`                      |                                                      |
| Chips        | `tint → tint-hover`                                                             |                               | White bg, black text                                 |
| Links        | Underline + white                                                               |                               |                                                      |
| Focus        | **2 px solid #fff outline, 2 px offset** everywhere; inset for chips and fields |                               |                                                      |

The focus ring is white on near-black, 18:1. Prefer white over the current green ring for fidelity.

### Per-release color (precomputed, not extracted at runtime)

Add `color` to each collection and track in `src/content/portfolio.ts`, and **enforce relative luminance ≤ 0.18** in `validate.ts` so white text on the header passes 4.5:1 _before_ the dark overlay.

Proposed original palette (approximate relative luminance):

- Experience cobalt `#2d46b9` (0.08)
- Projects raspberry `#b8336a` (0.14)
- Leadership ember `#c2491d` (0.16)
- Skills teal `#107a65` (0.15)
- Credentials steel `#1d6fa5` (0.14)
- Awards / Liked violet `#503aa8` (0.08)
- Education dark gold `#8a6a12` (0.16)
- Artist: compute from the portrait at build time with `sharp(img).stats().dominant`, then clamp.

Meta text on colored headers uses `rgb(255 255 255 / .85)`, never `#b3b3b3` (which drops to about 2:1 on color).

## B6. Component patterns

These are short sketches, not drop-in code. Each uses the tokens above and avoids the A-section pitfalls: no nested interactive elements, no conflicting color utilities, and real links for everything crawlable.

**1. App frame (desktop ≥1280; Option 3 layout)**

```tsx
// CSS: .app { display:grid; height:100dvh; padding:8px; gap:8px; background:var(--color-app);
//   grid-template: "top top" var(--topbar-h) "lib main" minmax(0,1fr) "bar bar" var(--player-h) / var(--lib) minmax(0,1fr); }
// .app[data-np="open"] { grid-template: "top top top" var(--topbar-h) "lib main np" minmax(0,1fr)
//   "bar bar bar" var(--player-h) / var(--lib) minmax(0,1fr) var(--np-w); }
export function AppFrame() {
  const { libCollapsed, npOpen } = useLayoutPrefs(); // SSR default: expanded lib, NP closed
  return (
    <div
      className="app max-md:block"
      data-np={npOpen ? "open" : "closed"}
      style={
        {
          "--lib": libCollapsed ? "var(--lib-rail)" : "var(--lib-w)",
        } as React.CSSProperties
      }
    >
      <TopBar className="[grid-area:top]" />
      <LibraryPanel className="[grid-area:lib] max-md:hidden" />
      <main
        id="main-content"
        className="[grid-area:main] @container overflow-y-auto rounded-panel bg-surface scroll-pb-(--player-h)"
      >
        <Outlet />
      </main>
      {npOpen && <NowPlayingPanel className="[grid-area:np] max-xl:hidden" />}
      <PlayerBar className="[grid-area:bar] max-md:hidden" />
      <MobileDock className="md:hidden" />
      {/* mini player + gradient tab bar */}
    </div>
  );
}
// Resizer between lib and main (WCAG 2.5.7: keyboard + collapse button as non-drag alternatives)
<div
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize Your Library"
  tabIndex={0}
  aria-valuemin={280}
  aria-valuemax={420}
  aria-valuenow={w}
  onKeyDown={(e) => {
    if (e.key === "ArrowLeft") setW(Math.max(280, w - 16));
    if (e.key === "ArrowRight") setW(Math.min(420, w + 16));
  }}
  onPointerDown={startDrag}
  className="w-2 cursor-col-resize rounded-full hover:bg-white/20 focus-visible:bg-white/30"
/>;
```

**2. Global top bar with progressive-enhancement search** (works without JS; crawlable `/search?q=`)

```tsx
<header className="flex items-center gap-2 px-2">
  <Link to="/" aria-label="Darshify home">
    <DarshifyMark className="size-8" />
  </Link>
  <div className="mx-auto flex w-full max-w-[34rem] items-center gap-2">
    <NavLink
      to="/"
      end
      aria-label="Home"
      className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-hi text-subdued transition hover:scale-104 hover:text-fg aria-[current=page]:text-fg"
    >
      <HomeIcon filled={isHome} />
    </NavLink>
    <form role="search" action="/search" className="group relative flex-1">
      <label htmlFor="q" className="sr-only">
        Search Darshil’s work
      </label>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-6 -translate-y-1/2 text-subdued group-focus-within:text-fg" />
      <input
        id="q"
        name="q"
        type="text"
        inputMode="search"
        autoComplete="off"
        placeholder="What do you want to explore?"
        className="h-12 w-full rounded-full bg-surface-hi pl-12 pr-4 text-base text-fg placeholder:text-subdued
                   hover:bg-surface-2 hover:ring-1 hover:ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg"
      />
    </form>
  </div>
  <AccountMenu /* avatar → Download CV · Email · LinkedIn · Copy profile link · Keyboard shortcuts */
  />
</header>
```

**3. Library row + filter chips**

```tsx
<div role="group" aria-label="Filter Your Library" className="flex gap-2 px-4">
  {["Playlists", "Albums", "Artists"].map((f) => (
    <button key={f} type="button" aria-pressed={filter === f} onClick={() => toggle(f)}
      className="h-8 rounded-full bg-tint px-3 text-sm text-fg hover:bg-tint-hover aria-pressed:bg-fg aria-pressed:text-black">{f}</button>
  ))}
</div>
<NavLink to={href} className="group flex items-center gap-3 rounded-[6px] p-2 hover:bg-tint aria-[current=page]:bg-tint-hover">
  <img src={art} alt="" width={48} height={48} className={`size-12 ${isArtist ? "rounded-full" : "rounded-row"}`} />
  <span className="min-w-0 flex-1">
    <span className={`block truncate ${isPlaying ? "text-green" : "text-fg"}`}>{title}</span>
    <span className="block truncate text-sm text-subdued">{pinned && <PinIcon className="mr-1 inline size-3 text-green" />}{kind} • Darshil Jain</span>
  </span>
  {isPlaying && <SpeakerIcon className="size-4 text-green" aria-label="Now playing" />}
</NavLink>
```

**4. Release header + action bar (artwork-driven color)**

```tsx
<section style={{ "--release": release.color } as React.CSSProperties}>
  <header className="@container flex items-end gap-6 bg-(--release) bg-[linear-gradient(transparent,rgb(0_0_0/.5))] px-(--content-x) pb-6 pt-20 max-md:flex-col max-md:items-center">
    <img
      src={release.cover}
      alt=""
      width={232}
      height={232}
      fetchPriority="high"
      className="size-[clamp(8rem,24cqi,14.5rem)] rounded-art shadow-art"
    />
    <div className="min-w-0 max-md:self-stretch">
      <p className="text-sm font-medium">{release.typeLabel /* "EP" */}</p>
      <h1 className="text-display text-balance">{release.title}</h1>
      <p className="mt-3 text-sm text-white/85">{release.tagline}</p>
      <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-white/85">
        <img src={avatar} alt="" className="size-6 rounded-full" />
        <Link to="/artist" className="font-bold text-fg hover:underline">
          Darshil Jain
        </Link>
        <span aria-hidden="true">•</span>
        {release.years}
        <span aria-hidden="true">•</span>
        {tracks.length} songs, {release.span}
      </p>
    </div>
  </header>
  <div className="bg-(--release) bg-[linear-gradient(rgb(0_0_0/.6)_0,var(--color-surface)_15rem)] px-(--content-x)">
    <div className="flex items-center gap-6 py-6">
      <PlayButton
        size={56}
        playing={isThisListPlaying}
        label={`Play ${release.title}`}
        onClick={() => playList(release.id)}
      />
      <IconButton label="Shuffle" pressed={shuffle} onClick={toggleShuffle}>
        <ShuffleIcon />
      </IconButton>
      <IconButton
        label="Download Darshil’s CV"
        href="/Darshil_Jain_Resume.pdf"
        download
      >
        <DownloadCircleIcon />
      </IconButton>
      <MoreMenu items={["Copy link", "Add to queue", "Go to artist"]} />
    </div>
    <TrackList tracks={tracks} />
  </div>
</section>
```

**5. Track row (56 px; play-swap; equalizer; whole row clickable without nested controls)**

```tsx
<ol aria-label={`${release.title} tracks`}>
  {/* decorative column header, aria-hidden; each row is self-describing */}
  {tracks.map((t, i) => {
    const current = nowPlaying?.id === t.id;
    return (
      <li
        key={t.id}
        className="group relative grid h-14 grid-cols-[1rem_minmax(0,6fr)_minmax(0,4fr)_minmax(0,3fr)_4rem]
                                 items-center gap-4 rounded-row px-4 hover:bg-tint-hover focus-within:bg-tint-hover
                                 @max-[45rem]:grid-cols-[1rem_minmax(0,1fr)_4rem]"
      >
        <span className="relative z-10 grid place-items-center text-subdued tabular-nums">
          {current ? (
            <Equalizer />
          ) : (
            <span className="group-hover:hidden group-focus-within:hidden">
              {i + 1}
            </span>
          )}
          <button
            type="button"
            aria-label={`Play ${t.title}`}
            onClick={() => play(t.id)}
            className="hidden text-fg group-hover:block group-focus-within:block"
          >
            <PlayIcon className="size-4" />
          </button>
        </span>
        <span className="flex min-w-0 items-center gap-3">
          <img
            src={t.cover}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-row"
          />
          <span className="min-w-0">
            <Link
              to={`/case-studies/${t.slug}`}
              className={`block truncate after:absolute after:inset-0 ${current ? "text-green" : "text-fg"}`}
            >
              {t.title}
            </Link>
            <span className="block truncate text-sm text-subdued">
              {t.organization}
            </span>
          </span>
        </span>
        <span className="truncate text-sm text-subdued @max-[45rem]:hidden">
          <span className="sr-only">Impact: </span>
          {t.impact ?? "—"}
        </span>
        <span className="text-sm text-subdued @max-[45rem]:hidden">
          <span className="sr-only">Started: </span>
          {t.startLabel}
        </span>
        <span className="text-right text-sm text-subdued tabular-nums">
          <span className="sr-only">Length: </span>
          {t.lengthLabel /* "2 mo" */}
        </span>
      </li>
    );
  })}
</ol>
// <Equalizer/>: <span className="eq inline-flex h-3.5 items-end gap-0.5" aria-hidden>{[0,1,2,3].map(n=>
//   <i key={n} className="w-[3px] origin-bottom bg-green animate-eq" style={{animationDelay:`${-n*0.27}s`}}/>)}</span>
//   + <span className="sr-only">Now playing</span>
```

**6. Media card (hover play rises; stretched link; button is a sibling, not nested)**

```tsx
<article className="group relative rounded-panel p-3 transition-colors duration-(--dur-hover) hover:bg-surface-hi focus-within:bg-surface-hi">
  <div className="relative mb-3">
    <img
      src={cover}
      alt=""
      width={180}
      height={180}
      loading="lazy"
      className={`aspect-square w-full object-cover shadow-card ${round ? "rounded-full" : "rounded-art"}`}
    />
    <button
      type="button"
      aria-label={`Play ${title}`}
      onClick={onPlay}
      className="absolute bottom-2 right-2 z-10 grid size-12 translate-y-2 place-items-center rounded-full bg-green text-black opacity-0 shadow-play
                 transition duration-(--dur-reveal) ease-emph group-hover:translate-y-0 group-hover:opacity-100
                 focus-visible:translate-y-0 focus-visible:opacity-100 hover:scale-104 hover:bg-green-hover active:scale-96
                 [@media(hover:none)]:hidden"
    >
      <PlayIcon className="size-6" />
    </button>
  </div>
  <h3 className="truncate font-bold">
    <Link
      to={href}
      className="after:absolute after:inset-0 after:rounded-panel"
    >
      {title}
    </Link>
  </h3>
  <p className="mt-1 line-clamp-2 text-sm text-subdued">{subtitle}</p>
</article>
```

**7. Player bar (always mounted; idle state = "Career Mix · Darshil Jain")**

```tsx
<footer
  aria-label="Player"
  className="grid grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,3fr)] items-center gap-2 bg-app px-2"
>
  <div className="flex min-w-0 items-center gap-3">
    <img
      src={track.cover}
      alt=""
      width={56}
      height={56}
      className="size-14 rounded-row"
    />
    <div className="min-w-0">
      <Link
        to={track.href}
        className="block truncate text-sm text-fg hover:underline"
      >
        {track.title}
      </Link>
      <Link
        to="/artist"
        className="block truncate text-xs text-subdued hover:text-fg hover:underline"
      >
        Darshil Jain
      </Link>
    </div>
    <SaveButton
      id={track.id} /* "Added to Your Library" toast via aria-live */
    />
  </div>
  <div className="flex w-full max-w-[45rem] flex-col items-center gap-1 justify-self-center">
    <div className="flex items-center gap-4">
      <IconButton label="Shuffle" pressed={shuffle}>
        <ShuffleIcon />
      </IconButton>
      <IconButton label="Previous">
        <PrevIcon />
      </IconButton>
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={toggle}
        className="grid size-8 place-items-center rounded-full bg-fg text-black transition hover:scale-106 active:scale-96"
      >
        {playing ? (
          <PauseIcon className="size-4" />
        ) : (
          <PlayIcon className="size-4" />
        )}
      </button>
      <IconButton label="Next">
        <NextIcon />
      </IconButton>
      <IconButton label="Repeat" pressed={repeat}>
        <RepeatIcon />
      </IconButton>
    </div>
    <div className="flex w-full items-center gap-2 text-xs tabular-nums text-subdued">
      <span className="w-10 text-right">{fmt(elapsed)}</span>
      <input
        type="range"
        min={0}
        max={total}
        step={1000}
        value={elapsed}
        onChange={(e) => seek(+e.target.value)}
        aria-label="Seek"
        aria-valuetext={`${fmt(elapsed)} of ${fmt(total)}: ${track.title}`}
        className="scrubber flex-1"
      />
      <span className="w-10">{fmt(total)}</span>
    </div>
  </div>
  <div className="flex items-center justify-end gap-1">
    <IconButton label="Now playing view" pressed={npOpen}>
      <NowPlayingIcon />
    </IconButton>
    <IconButton label="Lyrics" pressed={lyricsOpen}>
      <MicIcon />
    </IconButton>
    <IconButton label="Queue" pressed={queueOpen}>
      <QueueIcon />
    </IconButton>
    <IconButton
      label="Download Darshil’s CV"
      href="/Darshil_Jain_Resume.pdf"
      download
    >
      <DownloadIcon />
    </IconButton>
    {/* No volume slider unless real audio exists */}
  </div>
</footer>
// .scrubber: 4px track #4d4d4d, white fill via --pct background; :hover fill → var(--color-green) + 12px white thumb.
```

**8. Now Playing panel + synced "lyrics" (case-study bullets)**

```tsx
<aside
  aria-label="Now playing"
  className="flex flex-col gap-4 overflow-y-auto rounded-panel bg-surface p-4"
>
  <header className="flex items-center justify-between">
    <h2 className="truncate font-bold">{context.title /* "Career Mix" */}</h2>
    <IconButton label="Hide now playing view" onClick={closeNp}>
      <CloseIcon />
    </IconButton>
  </header>
  <div className="relative aspect-square overflow-hidden rounded-panel">
    {canvasOn ? (
      <CanvasLoop color={track.color} />
    ) : (
      <img src={track.cover} alt="" className="size-full object-cover" />
    )}
  </div>
  <div>
    <h3 className="text-title">
      <Link to={track.href} className="hover:underline">
        {track.title}
      </Link>
    </h3>
    <p className="text-subdued">Darshil Jain · {track.organization}</p>
  </div>
  <section
    aria-labelledby="lyrics-h"
    className="rounded-panel p-4"
    style={{ backgroundColor: track.color }}
  >
    <h3 id="lyrics-h" className="font-bold">
      Lyrics
    </h3>
    <ol className="mt-3 space-y-2 text-lyric">
      {track.lines.map((line, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => seek(line.at)}
            aria-current={i === active ? "true" : undefined}
            className={`text-left transition-colors duration-(--dur-reveal) ${i === active ? "text-fg" : "text-white/60 hover:text-white/80"}`}
          >
            {line.text}
          </button>
        </li>
      ))}
    </ol>
  </section>
  <CreditsCard
    rows={[
      ["Role", track.role],
      ["Organization", track.organization],
      ["Source", "Darshil Jain résumé (PDF)"],
    ]}
  />
  <AboutArtistCard /> <NextInQueueCard />
</aside>
```

**9. Browse tile (skills as genres)**

```tsx
<Link
  to={`/genre/${skill.slug}`}
  className="relative block aspect-[1.6] overflow-hidden rounded-panel p-4 transition hover:brightness-110"
  style={{ backgroundColor: skill.color }}
>
  <span className="text-2xl font-bold text-balance">{skill.label}</span>
  <img
    src={skill.cover}
    alt=""
    className="absolute -bottom-1 -right-4 w-[45%] rotate-[25deg] rounded-row shadow-card"
  />
</Link>
```

## B7. Three layout options

|                    | **Option 1: Faithful 3-column app**                                                                                                                                                             | **Option 2: 2-column with overlay Now Playing**                                                            | **Option 3: Hybrid (Option 1 + Rewind story) ★ recommended**                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop ≥1280      | Top bar · resizable Library · main · **docked Now Playing view** · 72 px player bar, always mounted                                                                                             | Top bar · Library · wide main · player bar. NP and queue open as a right **overlay sheet** from the player | Option 1 frame. NP docks at ≥1280 and becomes an overlay sheet at 1024–1279 (Option 2 behavior); the Library auto-collapses to a 72 px rail below 1280 |
| Mobile <768        | Spotify app pattern: edge-to-edge document scroll, sticky translucent header, gradient tab bar, 56 px colored **mini player**, full-screen player as a `<dialog>` sheet (drag _and_ ✕ to close) | Same                                                                                                       | Same, plus a **Rewind** banner card at the top of Home                                                                                                 |
| Main width at 1440 | ≈ 808 px (1440 − 280 − 320 − 32) → drop Album/Date columns via container queries under 720 px                                                                                                   | ≈ 1,120 px                                                                                                 | ≈ 808 px docked; full width when NP is closed                                                                                                          |
| Immersion          | Highest. Every Spotify pillar is present; NP doubles as live "liner notes" while browsing                                                                                                       | Medium. Feels like Spotify circa 2022                                                                      | Highest, plus the "wow" opener                                                                                                                         |
| Cost and risk      | Most layout state (two resizers, persisted prefs, focus management for two panels); more JS on the critical path                                                                                | Simplest and most robust on 13" laptops; less to test                                                      | Option 1 cost + story (~1–2 days); story must never block content or SEO                                                                               |
| A11y risk          | Panel focus order, 2.5.7 drag alternatives, 2.4.11 focus not obscured by player/top bar                                                                                                         | Lowest                                                                                                     | As Option 1, plus story dialog (focus trap, pause, Esc, reduced-motion manual mode)                                                                    |

**Recommendation: Option 3**, with two guardrails.

1. **Rewind is opt-in, never a forced first-visit takeover.** Home shows a "Darshil’s 2026 Rewind" banner with a 6-second ambient teaser loop, and `/rewind` is a real, SSR'd page whose slides are `<section>`s. An auto-opening full-screen story on mobile would count as an intrusive interstitial for Google, would cost recruiters time, and would need WCAG 2.2.2 controls on load.
2. **The NP panel's initial state is SSR-safe:** closed on the server, opened on first play, and remembered in `localStorage` (try/catch) afterwards.

The player bar is always mounted. Idle, it shows "Career Mix · Darshil Jain" with ▶, so the defining Spotify element is visible from the first paint.

## B8. "Mesmerize" moments: tasteful, accessible, crawlable

1. **Living color.**
   - **What:** each release's precomputed color floods its header and fills the sticky top bar on scroll (a CSS scroll-driven animation; no React state per scroll). On Home, **hovering or focusing a quick pick crossfades the page-top gradient** to that release's color (500 ms; instant with reduced motion). On mobile, the mini player takes the playing track's color.
   - **Guardrail:** luminance ≤ 0.18 is validated in content tests (B5).
2. **A Career Mix that drives the whole UI.**
   - **What:** a real 60–90 s queue of 6–8 tracks. While playing, the player bar shows art, title and times; the NP panel shows art, Canvas, **lyrics**, credits and next in queue; the current row is green with an equalizer; the Library item shows a green speaker; and `document.title` reads "▶ Operations Intern at Figmenta • Darshil Jain".
   - **Behavior:** play on any list plays _that_ list. Shuffle, repeat, prev/next and seek are all real; the volume slider is hidden unless audio exists.
   - **Guardrail:** it is pausable everywhere (WCAG 2.2.2), with a polite live-region announcement per track. It never autoplays.
3. **Lyrics-mode case studies.**
   - **What:** each case study's Situation, Actions and Result become 4–7 "lyric lines" with timestamps. The active line brightens and auto-scrolls; clicking a line seeks.
   - **Guardrail:** the same lines render as plain SSR text on the Song page, so they are crawlable and readable without JS or playback.
4. **Canvas loops.**
   - **What:** a subtle 6–8 s seamless loop per track behind the NP art: SVG/CSS gradient blobs or waves in the track color, under 30 KB, GPU transforms only. Paused off-screen (IntersectionObserver) and when the tab is hidden.
   - **Guardrail:** off by default under `prefers-reduced-motion`, with a "Canvas" toggle in the NP … menu (WCAG 2.2.2).
5. **Darshify Rewind (`/rewind`).**
   - **What:** 6–8 slides of real numbers ("500+ résumés screened", "Top genre: Operations", "Top track: Figmenta", "1,000+ fest participants", "BBA · CGPA 9.39"), segmented progress, tap or arrow navigation, hold or focus to pause, Esc to close, and a final **share card** that doubles as the OG image.
   - **Guardrail:** reduced motion switches it to manual mode with no kinetic type.
6. **Shared-element transitions.** A card's cover morphs into the release header via React Router's `viewTransition` on `<Link>` (View Transitions API), plus a 150 ms crossfade elsewhere. Disabled under reduced motion; content is unaffected where unsupported.
7. **Sticky header morph.** The big title scrolls away into the top bar, which gains a 40 px green play button and the title (an IntersectionObserver sentinel).
8. **Micro-interactions:**
   - Card play button rise (300 ms `ease-emph`).
   - `scale-104` on hover.
   - Scrubber turns green and grows a knob on hover.
   - Heart pop (scale 1.2 → 1, 200 ms) on save.
   - A toast ("Link copied", "Downloading Darshil’s CV", "Added to Your Library") above the player, with `aria-live="polite"`.
9. **Power-user details:**
   - A right-click and … **context menu** (`role="menu"`, arrow keys, Esc, focus return): Open, Add to queue, Copy link, Go to album, View credits, Download CV.
   - **Keyboard shortcuts:** Space to play/pause (ignored while focus is in a field or on a control), Ctrl/⌘+K to search, Shift+N / Shift+P for next/previous, Alt+Shift+B to save, `?` for the shortcuts dialog. A toggle in that dialog turns off character-key shortcuts (WCAG 2.1.4).
10. **Optional real audio.** Only if Darshil records a 60–90 s voice intro: it plays inside the same player, with captions in the lyrics panel and a transcript on `/artist`. Never synthesized audio and never autoplay.

## B9. Keep everything crawlable (SEO)

- **Keep SSR and prerender for all canonical routes,** and add `/genre/:skill` and `/rewind` to `canonicalRouteInventory` and `sitemap.xml`.
- **The page content is the SSR'd main view.** Panels such as Now Playing, the queue and menus are client-state _views of the same content_, never the only place a fact lives.
- **Every card, row, tile and menu destination is a real `<a href>`;** play buttons are extra `<button>`s beside them. Use the stretched-link pattern from B6 #5–6 so a row has no nested interactive content.
- **One H1 per page:** the giant release, artist or song title. Document title pattern: "Operations Intern at Figmenta • Darshil Jain | Darshify" (Spotify's "Song • Artist" format, good for SEO too).
- **Search state lives in the URL:** a `/search?q=` GET form, with `noindex,follow` on query URLs and the canonical on `/search`.
- **Fix duplicates:** 301 `/playlist/achievements` → `/liked`. Keep `/case-studies/:slug` as the canonical Song page (existing backlinks and sitemap); any `/track/*` alias redirects there.
- **Structured data:**
  - Extend Person to `ProfilePage` + `Person`, with `alumniOf`, `knowsAbout` (skills) and `sameAs`.
  - Collections become `ItemList` of `CreativeWork`; case studies become `CreativeWork`/`Article`.
  - Certifications become `EducationalOccupationalCredential`.
  - **No** `MusicRecording`/`MusicGroup` types; the work isn't music.
- **Greeting:** render a neutral "Good day" server-side and swap to the local-time greeting after hydration (`suppressHydrationWarning` on that node). Never compute it in a prerendered loader.
- **Performance:**
  - Covers: AVIF/WebP rendered at build time with `sharp` from SVG sources, _with the brand font embedded_, plus `srcset` at 48/180/232/464 px.
  - Images: `fetchPriority="high"` only on the header art or banner (the LCP); lazy-load everything else.
  - Fonts: one preloaded variable font.
  - JS: no runtime color extraction and no video Canvas on the critical path.

## B10. WCAG 2.2 AA checklist for this design

- **1.4.3 / 1.4.11 contrast:** text tokens as in B5; header color luminance ≤ 0.18; icons ≥ 3:1 (`#7c7c7c` minimum, non-text only). The current invisible toggle is a 1.4.11 failure.
- **2.4.11 Focus not obscured:** the sticky top bar, sticky table header and the 72 px player must not cover focus. Set `scroll-padding-top` and `scroll-padding-bottom` on the main scroller.
- **2.5.8 Target size:** desktop icon buttons 32 px visual with ≥ 24 px hit areas; touch targets ≥ 44 px under `(pointer: coarse)`. Replace the global 44 px rule (`base.css:54-57`).
- **2.5.7 Dragging movements:**
  - Panel resizers: arrow keys, plus a collapse button as the single-pointer alternative.
  - Scrubber: native range input with click-to-seek.
  - Mobile full-screen player: a ✕ button as well as drag-down.
- **2.2.2 Pause, stop, hide:** Career Mix, Canvas loops, the Rewind auto-advance and the Home teaser all need visible pause; under reduced motion, Canvas is off and Rewind is manual.
- **2.1.4 Character key shortcuts:** turn-off toggle (B8 #9); Space is active only when focus is not on an interactive or editable element.
- **4.1.2 Name, role, value:** `aria-pressed` on shuffle/repeat/lyrics/queue/NP toggles; `aria-current` on the playing row and active lyric; menus with `role="menu"`; the story as a modal `dialog` with `aria-roledescription="slide"` sections.
- **4.1.3 Status messages:** toasts and "Now playing: …" in a polite live region (one, not per component).
- **Reduced motion:** keep the global rule (`base.css:100-121`) and add `--dur-*: 0`, a static equalizer, Canvas off, no view transitions, and manual Rewind.
- **Reflow and zoom:** the 3-column frame collapses (rail → overlay NP → mobile) by width, so 400 % zoom lands on the mobile layout with no horizontal scroll (the current state is clean; keep it).

## B11. IP safety

- **Brand:** keep the **Darshify** name and mark (a green circle with a play glyph is fine). Don't use Spotify's three-arc logo, its wordmark, or a lowercase wordmark imitation. Title-case "Darshify" in Figtree 800.
- **Fonts and icons:** don't use Spotify Mix or Circular. Draw original icons or use MIT-licensed sets (Lucide, Phosphor, Tabler) at 24 px, adjusted to Spotify's filled/outline logic; don't copy Encore SVG paths.
- **Names:** avoid "Spotify", "Wrapped", "Premium" and "Canvas" as product names in the UI (use "Rewind" and "Visualizer"). Generic phrases such as "Your Library", "Liked Songs", "Made for you" and "Now playing" are fine.
- **Disclaimer:** add a footer and liner note: "Darshify is a personal portfolio inspired by music-streaming apps. Not affiliated with or endorsed by Spotify."
- **Third-party logos:** don't show organization logos (Figmenta, IIM, IIT Guwahati) without permission; use typographic covers.

## B12. Content and asset dependencies (blockers for the "wow")

1. **A real portrait of Darshil** (square, ≥ 1200 px) and ideally a **wide banner photo** (≥ 2400×900). The Artist page, the About card, the NP "About the artist" card and Rewind all depend on them. None exist in the repo today.
2. **Original artwork for 6 collections and ~17 tracks.** Typographic, color-field covers in Figtree, generated from content at build time; no stock or AI objects (consistent with the earlier art-direction findings).
3. **Per-release colors** (B5) and **lyric lines plus timestamps** per track, derived from the existing `situation`, `actions` and `result`.
4. **Confirmed availability or target-role wording**, or drop that section.
5. _(Optional)_ a recorded 60–90 s voice intro with a transcript.

## B13. Decisions to surface in Phase 2 (don't resolve silently)

1. **Immersion vs. the previous "recruiter-briefing first" direction.** Recommended: honest fidelity (B1); CV stays one click away everywhere.
2. **Career Mix scope.** The old synthesis said to drop queue, shuffle and repeat. Recommended: the full transport, all of it real, with no volume control unless audio exists.
3. **Retire the Proof Waveform and the monospace "evidence voice".** Recommended: yes. The candidate-specific signature becomes _lyrics-mode case studies + Rewind_.
4. **Layout:** Option 3 (recommended) vs. Option 1 vs. Option 2.
5. **Font:** Figtree (recommended) vs. DM Sans vs. Plus Jakarta Sans.
6. **Achievements naming:** "Liked Songs"-styled "Awards" at `/liked`, or a plain "Awards" playlist.
7. **Rewind:** opt-in banner + `/rewind` (recommended) vs. a first-visit auto-open.

---

### Sources

- Spotify desktop redesign (Your Library left, Now Playing right, resizing, grid view): [Spotify Newsroom](https://newsroom.spotify.com/?p=23515), [TechRadar](https://www.techradar.com/audio/spotify/spotify-on-desktop-is-about-to-look-very-different-here-are-the-two-big-changes), [RouteNote](https://routenote.com/blog/spotify-updates-desktop-apps/), [DT Next](https://www.dtnext.in/lifestyle/technology/spotify-getting-redesigned-your-library-now-playing-views-on-desktop-719611)
- Spotify Mix typeface (Dinamo, May 2024, replaced Circular, variable): [It's Nice That](https://www.itsnicethat.com/articles/spotify-dinamo-new-typeface-spotify-mix-project-230524), [Creative Bloq](https://www.creativebloq.com/news/spotify-font-design), [Fonts In Use](https://fontsinuse.com/uses/63891/spotify-2024-redesign), [Design Compass](https://designcompass.org/en/2024/05/23/spotify-mix)
- Third-party reconstruction of Spotify dark-palette variables (`#121212` base; subdued text `#a7a7a7` older, `#b3b3b3` current; unverified, check in DevTools): [Blake Crosley design guide](https://blakecrosley.com/guides/design/spotify)
- Figtree ("a friendly, simple geometric sans serif", OFL): [erikdkennedy/figtree](https://github.com/erikdkennedy/figtree). `tnum` support was not confirmed in public docs; verify as described in B5.
- Contrast ratios in B5/B10 are computed with the WCAG 2.x relative-luminance formula from the listed hex values.
