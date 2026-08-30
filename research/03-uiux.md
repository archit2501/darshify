# Darshify large-redesign UI/UX research

## Scope and standard

Darshify is a recruiting portfolio for Darshil Jain, a BBA candidate targeting strategy, operations, consulting, and business roles. Its non-negotiable creative constraint is a Spotify-themed experience. The primary user is a time-poor recruiter or hiring manager; the primary task is to understand the candidate, inspect credible evidence, and download the CV or make contact.

This report evaluates the shipped desktop and mobile application, its source, and the existing `DESIGN-IS-2026-08-29` evidence. The earlier findings were checked against the current `build/darshify` branch and the captured 1440 × 1000 and 390 × 844 screenshots. The relevant external baseline is WCAG 2.1 AA plus the current Vercel Web Interface Guidelines fetched on 2026-08-29. This is design research, not an implementation spec, and it intentionally does not repeat a Rams score.

The blunt diagnosis: **the Spotify theme is not the problem; treating Spotify's product simulation as the portfolio's information architecture is the problem.** The site is polished enough to win a quick “cool clone” reaction, but not structured or honest enough to win recruiter trust. The redesign should keep the dark streaming vocabulary, album/track metaphor, and Darshify name while making every visible surface answer: “Why Darshil, what has he done, and how do I verify it?”

---

## Part A — Brutally honest audit

### 1. The first screen wastes the recruiter's most valuable seconds

- Home opens with a time-aware “Good morning,” not Darshil's role, specialty, availability, or strongest evidence (`src/pages/Home.tsx:9-12`, `src/pages/Home.tsx:31-50`). That greeting is faithful to Spotify and almost useless to a recruiter.
- Six large quick-pick tiles then repeat destinations already present in the desktop library (`src/pages/Home.tsx:20-27`, `src/shell/Sidebar.tsx:26-46`). Below them, the same categories return as “Made for Recruiters,” “Your Top Hits,” and “Jump back in” (`src/pages/Home.tsx:52-73`). The page has breadth without prioritization.
- The homepage contains no clear positioning sentence, no availability/status, no visible email or LinkedIn action, no selected-project outcome, and no explanation of what “play” will do. A recruiter learns the interaction model before learning the candidate.
- The canonical route inventory contains 207 authored interactive elements; the persistent desktop shell contributes 23 and Home contributes 44 (`DESIGN-IS-2026-08-29/01-structural-copy.md#interactive-element-count`). That is absurdly high for a portfolio whose core job is scan → verify → contact.
- The strongest real facts—35+ projects coordinated, 70+ clients supported, 500+ résumés screened, 100+ interviews, top-10% and finalist results—exist in track details or data but do not lead the first view (`src/data/library.ts:15`, `src/data/library.ts:25-38`). The hierarchy rewards novelty over proof.

**Screenshot evidence**

| Screenshot                                                    | What it proves                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DESIGN-IS-2026-08-29/screenshots/desktop-home-1440x1000.png` | The first viewport is dominated by greeting, duplicated navigation, six category tiles, four generic covers, and a full player. No role proposition, contact route, or project outcome appears in the main content. “Your Top Hits” repeats one brain image six times and the last card is visibly clipped. |
| `DESIGN-IS-2026-08-29/screenshots/mobile-home-390x844.png`    | At 390 px, the first viewport is almost entirely greeting plus six navigation tiles. The first evidence card is cut off; CV, email, LinkedIn, quantified proof, and an explanatory value proposition are absent.                                                                                            |
| `DESIGN-IS-2026-08-29/screenshots/desktop-projects.png`       | The project page devotes a large hero and most table columns to album type, fake plays, and invented duration while hiding the actual case outcomes. Roughly the lower half of the viewport is empty.                                                                                                       |

### 2. The “player” is a high-effort decoy, not a career communication tool

- Play/pause, previous/next, shuffle, repeat, seek, queue, like, volume, ambient audio, and a now-playing panel are all implemented (`src/shell/PlayerBar.tsx:16-83`, `src/shell/AppShell.tsx:63-90`). Most do nothing to help someone assess employability.
- Pressing play advances a timer over an invented duration. If ambient audio is enabled, it produces a generated three-note oscillator chord based on content type—not an interview clip, narration, presentation, or other evidence (`src/player/PlayerContext.tsx:29-35`, `src/player/PlayerContext.tsx:81-107`; `src/player/useAmbient.ts:10-35`). “Play” therefore promises meaningful media and delivers a simulation.
- The default player is visually active before the user has chosen anything because a flagship track is preloaded (`src/player/PlayerContext.tsx:51-53`). The pulsing “Press play” callout commands attention at initial load (`src/shell/PlayerBar.tsx:44-53`). It is an onboarding prompt for a feature with no recruiting payoff.
- Queue, likes, follow, shuffle, and repeat are competent engineering applied to the wrong problem. They raise maintenance and accessibility cost while burying the user's actual next step.

**What should survive:** the music metaphor, a compact now-viewing strip, and an optional genuine highlight tour. **What should not survive:** fake audio playback, invented time, and a transport-control stack that claims more meaning than it provides.

### 3. Trust is damaged by fabricated platform signals

- “✓ Verified Candidate” is hard-coded with no verifier or credential source (`src/pages/ArtistPage.tsx:25`). The visual language implies third-party validation that does not exist.
- “98,400 monthly listeners” is a local constant (`src/data/library.ts:12-16`). Track plays from 110,000 to 920,000 are likewise hard-coded (`src/data/library.ts:18-38`), then used to construct “Your Top Hits” and “Popular” rankings (`src/pages/Home.tsx:29`, `src/pages/ArtistPage.tsx:15`). This is fabricated social proof, not harmless decoration.
- “Follow” only changes component state for the current session (`src/pages/ArtistPage.tsx:13`, `src/pages/ArtistPage.tsx:34-37`). It implies a relationship action without creating one.
- “Recents” does not apply a recency sort; it is merely the unsorted default (`src/pages/Library.tsx:21-34`). Search calls heterogeneous résumé results “Songs” (`src/pages/Search.tsx:93-97`). These are smaller label/behavior mismatches, but together they reinforce the sense that the interface is cosplaying a platform.
- The genuine résumé content substantially matches the bundled CV. That makes the dishonesty more self-defeating: real achievements are made to look questionable by being presented beside invented popularity.

**Screenshot evidence:** `desktop-artist.png` and `mobile-artist.png` put the verification badge and listener count immediately above the candidate name and before any work evidence. On desktop, six fake play counts form the dominant comparison column. On mobile, the fake badge, listener count, play button, and Follow button consume most of the first screen.

### 4. It looks like a derivative clone, not Darshil's professional identity

- The near-black shell, green circular play button, library rail, quick picks, shelves, artist hero, “Popular” table, “Discography,” liked songs, and persistent player reproduce the reference product's recognizable grammar (`src/index.css:2-9`; `src/shell/AppShell.tsx:52-81`; `src/pages/Home.tsx:35-73`; `src/pages/ArtistPage.tsx:18-49`). The Darshify name is clever, but the experience has little visual language specific to strategy, operations, or Darshil's work.
- The approved spec explicitly pursued an “exact app experience” and “every feature we can think of” (`docs/superpowers/specs/2026-06-17-darshify-design.md:20-27`, `docs/superpowers/specs/2026-06-17-darshify-design.md:36-52`). That goal explains the result, but it is the wrong goal for a 10/10 portfolio.
- Generic neon covers—a glowing brain, gears, chess knight, trophy, and medal—read like stock AI imagery. They communicate categories, not authorship, process, judgment, or proof. Six “Top Hits” cards reuse the same brain image (`src/data/library.ts:50-58`; `src/pages/Home.tsx:59-63`).
- Library abruptly drops the cover system and replaces it with unlabelled gradient squares/circles (`src/pages/Library.tsx:67-72`). That makes the identity feel assembled screen by screen rather than designed as a system.
- On desktop Home, “Show all” floats at the far edge of large empty header rows and the shelf overflows without useful scroll affordance (`src/shell/Shelf.tsx:6-17`). Cards truncate project/skill names, so the app aesthetic literally removes information to preserve card width (`src/shell/MediaCard.tsx:9-13`).

### 5. Typography and spacing are coherent at a token level but poorly allocated

The existing visual system is not chaotic. The black/panel/card layering, white/secondary hierarchy, green accent, and measured contrast are solid foundations (`src/index.css:2-9`; lowest measured solid-background text contrast 8.47:1 in `DESIGN-IS-2026-08-29/01-visual-accessibility.md`). The observed spacing mostly follows a usable 4–32 px rhythm.

The failure is allocation and hierarchy:

- Heavy weights are applied to the brand, greetings, shelves, cards, buttons, and massive page titles, so few elements feel editorially important. The typographic personality is “Spotify clone,” not “analytical operator.”
- Artist names reach `text-8xl` on desktop while actual evidence remains 14–16 px (`src/pages/ArtistPage.tsx:25-27`, `src/pages/ArtistPage.tsx:40-58`). Playlist titles reach `text-7xl` while outcomes are hidden in expandable rows (`src/pages/PlaylistPage.tsx:22-30`, `src/shell/TrackRow.tsx:44-64`).
- Mobile navigation labels are 10 px and the player callout is 11 px (`src/shell/BottomNav.tsx:4-5`; `src/shell/PlayerBar.tsx:50-53`). These sizes prioritize density over readability.
- The 320 px artist hero plus permanent lower chrome dramatically reduces usable mobile space (`src/pages/ArtistPage.tsx:21`; `src/shell/PlayerBar.tsx:17`; `src/shell/BottomNav.tsx:9-12`).
- Programmatic route focus lands on headings without a designed `focus-visible` treatment. The browser-default blue rectangle around Artist, Projects, and Library headings is visually jarring (`src/shell/AppShell.tsx:27-34`; `desktop-artist.png`, `desktop-projects.png`, `desktop-library.png`).

### 6. Accessibility is not a polish issue here; it breaks primary flows

- All six main Home tiles are clickable `<div>` elements with no keyboard handler. The nested play buttons are focusable but opacity-zero until hover (`src/pages/Home.tsx:35-48`). A keyboard user tabs to invisible actions while being unable to activate the visible destinations.
- `MediaCard` places a `<button>` inside a `<Link>` (`src/shell/MediaCard.tsx:8-22`). Nested interactive controls create invalid and confusing focus/activation behavior.
- Search and Library inputs have no label, name, or autocomplete strategy and suppress the outline without a replacement (`src/pages/Search.tsx:35-41`; `src/pages/Library.tsx:47-48`). Search also autofocuses unconditionally, including on mobile (`src/pages/Search.tsx:35-40`).
- There is no skip link; navigation landmarks have no accessible name; toasts have no live region (`src/shell/AppShell.tsx:52-81`; `src/shell/Sidebar.tsx:11`; `src/shell/BottomNav.tsx:9`; `src/shell/Toast.tsx:16-26`).
- The reduced-motion stylesheet only changes scroll behavior. It does not stop the initial pulse or toast animation (`src/index.css:17`; `src/shell/PlayerBar.tsx:44-53`; `src/shell/Toast.tsx:19-26`).
- Images lack explicit intrinsic dimensions and responsive sources (`src/shell/Art.tsx:7-15`). Art is lazy-loaded indiscriminately, including above-the-fold imagery.
- Hover-only reveals and opacity-zero controls appear across rows and cards (`src/shell/TrackRow.tsx:34-55`; `src/shell/MediaCard.tsx:14-20`). Touch and keyboard users do not receive the same affordances.

**Screenshot evidence:** `desktop-focus-invisible-quick-play-1440x1000.png` and `mobile-focus-invisible-quick-play-390x844.png` show focus landing on a play action with no visible control or ring. `desktop-focus-quick-actions-1440x1000.png` and `mobile-focus-quick-actions-390x844.png` show how the hidden tab stops appear before the visible destination hierarchy.

### 7. Mobile is a shrunken player, not a designed recruiter experience

- Desktop CV actions are intentionally hidden below the `sm`/`md` breakpoints (`src/shell/TopBar.tsx:29-32`; `src/shell/Sidebar.tsx:11`, `src/shell/Sidebar.tsx:47-50`). Email and LinkedIn only appear in Artist/About after Popular and Discography (`src/pages/ArtistPage.tsx:40-59`).
- Player plus bottom navigation consume 122 px, 14.5% of a 390 × 844 viewport (`src/shell/PlayerBar.tsx:17`; `src/shell/BottomNav.tsx:9-12`; measured in `DESIGN-IS-2026-08-29/01-visual-accessibility.md`). The “Press play” bubble overlaps content just above the chrome (`mobile-home-390x844.png`, `mobile-artist.png`).
- The mobile Home first screen has no conversion action at all. The site preserves playback and three navigation destinations while removing the CV—the exact opposite of recruiter priority.
- Horizontal shelves depend on swiping but have no visible progress, snap, or next-item cue beyond clipping. The mobile viewport shows partial cards without explaining that the row scrolls.
- Artist mobile uses large art and a 48 px name before surfacing the first weakly-described skill. It feels cinematic, but it is slow to evaluate.

### 8. Performance is dominated by avoidable visual waste

- Cold Home transfers 11,477,677 bytes across 13 requests; six PNG covers account for 11,279,186 decoded bytes, or 95.9% of the initial payload (`DESIGN-IS-2026-08-29/01-weight-friction.md#required-measurements`, `#transfer-composition`).
- Those megascale source files are commonly rendered at 44–176 px. There are no AVIF/WebP derivatives, `srcset`, or size-specific assets (`src/shell/Art.tsx:3-15`). `loading="lazy"` does not compensate for using the wrong source size.
- The initial JavaScript is comparatively reasonable at 125,741 transferred bytes, and lint, tests, build, and route integrity pass (`DESIGN-IS-2026-08-29/01-weight-friction.md#runtime-integrity-and-quality-gates`). The engineering base is sound; the image pipeline and product priorities are not.

---

## Part B — Spotify-preserving redesign recommendations

### 1. Reframe the product promise

Use the Spotify theme as a **navigation and storytelling grammar**, not as fake evidence.

The redesigned product should say, in its first viewport:

> **Darshil Jain — Strategy & Operations candidate who turns messy work into clear systems.**
> Coordinated 35+ projects across Asia, supported 70+ clients, and evaluated 500+ candidates.

The exact sentence should be verified against the CV before launch, but the structure is right: identity → role → operating value → three sourced proof points. The Spotify layer can label the collection “This Is Darshil,” use release art, track rows, a library/search pattern, and an optional profile mix. It must never rename unverifiable popularity into credibility.

### 2. Recommended component patterns

1. **Recruiter-first artist hero** — Candidate name, target roles, location/availability, one-sentence proposition, 2–3 sourced proof points, and CV/Email/LinkedIn actions. The hero may visually resemble an artist header, but proof and conversion appear before decorative metadata.
2. **Proof track row** — One row per experience/project with plain title, organization, date, outcome, and a clearly labelled “View proof”/“Read case” action. Album terms can remain as secondary eyebrows; plain-language meaning must remain primary.
3. **Evidence liner-notes drawer/page** — Each item follows Situation → Action → Result → Evidence. It includes a source date, artifact thumbnail/link when shareable, and explicit confidentiality/redaction notes. This is where Spotify's liner-notes metaphor becomes useful.
4. **Selected releases shelf** — At most 3 priority items above the fold. Each card carries a distinct real artifact, one outcome, and one action. Do not show six same-weight categories.
5. **Experience timeline/tracklist** — Chronological roles with impact in the main row, not hidden behind hover or expansion. Use number columns only for actual ordered sequence or measured outcomes.
6. **Compact recruiter dock** — Desktop: CV, Email, LinkedIn persist in the header. Mobile: a compact bottom action bar with “Download CV” and “Email” after the hero scrolls out; never compete with a player and bottom nav simultaneously.
7. **Real highlight-tour control** — If “Play” is retained, it must start a genuine 60–90 second captioned/narrated profile mix or an explicit guided evidence tour. If no media/tour exists, label the control “Start highlight tour,” not “Play,” and show exactly what will happen.
8. **Search that answers recruiter questions** — Placeholder: “Search skills, companies, or projects…” Results grouped as Experience, Projects, Skills, and Awards—not “Songs.” Filters/deep links should be reflected in the URL.

### 3. Truthful copy system

| Current copy/pattern             | Replacement                                                                   | Rule                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| “✓ Verified Candidate”           | “Open to strategy & operations roles” or a linked, named credential           | Never imply third-party verification without a real verifier and link.                     |
| “98,400 monthly listeners”       | “BBA (B&I) · CGPA 9.39” plus a source/date, or omit                           | A number must represent an actual measured fact and explain what it measures.              |
| “920,000 plays”                  | “500+ résumés screened” / “35+ projects coordinated,” only where attributable | No metaphorical metrics in numeric columns.                                                |
| “Popular” / “Your Top Hits”      | “Core strengths” / “Selected impact”                                          | Rank only when a real ranking rule is visible.                                             |
| “Made for Recruiters”            | “Selected work”                                                               | The content itself should be recruiter-oriented; do not narrate the audience back to them. |
| “Liked Songs”                    | “Awards & recognition”                                                        | Clever labels may be secondary, never at the cost of meaning.                              |
| “Follow”                         | “Connect on LinkedIn”                                                         | Action labels must describe the actual outcome.                                            |
| “Play”                           | “Start highlight tour” or “Play 75-sec introduction”                          | Only use “Play” when media or a defined tour actually starts.                              |
| “Songs”                          | “Results,” “Projects,” or “Experience”                                        | Result grouping should match what the user is searching.                                   |
| “EP / LP / Playlist”             | “Experience · EP,” “Projects · LP”                                            | Keep the themed term as flavor after the plain-language category.                          |
| “Show all”                       | “View all projects” / “View all experience”                                   | Every CTA names its destination.                                                           |
| “Internships on heavy rotation.” | “3 operations & HR internships · 2025–26”                                     | Supporting copy should add specific information, not theme filler.                         |

Every quantitative statement should carry an internal content field for source, period, and verification status. If that data is missing, the metric does not render.

### 4. Candidate-specific visual signature: the **Proof Waveform**

The one memorable aesthetic risk should be a **Proof Waveform**: a horizontal waveform/data-strip built from the real scale and sequence of Darshil's work—35+ project rows, 70+ client cases, 500+ screened candidates, 100+ interviews, competition placements—with each peak tied to a labelled, sourced event. It can animate once when a proof item is opened and collapse into a compact mark on cards.

This is not a random audio waveform. It is a visual index of actual work, so it belongs equally to music and operations. Each release/card should pair that signature with a redacted real artifact: a tracker crop, dashboard panel, case-slide fragment, market map, interview rubric, or certificate detail. When an artifact cannot be shown, use a typographic cover built from the real result and source label—not a synthetic brain, trophy, gear, or chess image.

Art-direction rules:

- 100% of priority project/experience covers use candidate-specific artifacts or fact-derived typography.
- Redact confidential names/data visibly and label the redaction; never fabricate a screenshot.
- One dominant artifact, one proof value, one category color. No decorative 3D objects.
- Crop variants are composed for 1:1 cards, 16:9 case-study heroes, and compact 48 px rows.
- Use responsive AVIF/WebP sources with a JPG/PNG fallback; SVG is preferred for the Proof Waveform.
- Cap category color to a thin signal (edge, waveform, chip). Do not flood every page with unrelated neon gradients.

### 5. Color, typography, and spacing system

Preserve the recognizable dark streaming foundation, but make it editorial and evidence-led.

**Color tokens**

| Token      |     Value | Use                                         |
| ---------- | --------: | ------------------------------------------- |
| `ink`      | `#000000` | App canvas only                             |
| `panel`    | `#121212` | Main surfaces                               |
| `elevated` | `#1B1B1B` | Cards/drawers                               |
| `line`     | `#303030` | Dividers and focus offsets                  |
| `text`     | `#F7F7F5` | Primary text                                |
| `muted`    | `#B3B3B3` | Secondary text; existing contrast is strong |
| `signal`   | `#1ED760` | Primary action, current item, proof marker  |

Keep black/green as the brand memory. Eliminate the current rainbow of category gradients as full-background decoration. If categories need differentiation, use 4 accessible secondary signal colors only in small chips or waveform segments, never for body copy.

**Type roles**

- Display/UI: **Archivo Variable** or the existing licensed grotesque after its provenance is documented; 700–900 for the name and section titles only.
- Body: **Archivo Variable**, 400–600, for minimal font overhead and a coherent family.
- Evidence/data: **IBM Plex Mono**, 500, used sparingly for dates, source labels, KPI values, and Proof Waveform annotations. This analytical utility voice distinguishes Darshify from a generic music clone.
- Scale: 12 utility, 14 metadata, 16 body, 20 card title, 28 section title, 40/56 hero on mobile/desktop. Never put essential navigation below 12 px; never let the candidate name crowd proof out of the viewport.
- Use tabular numerals for metrics; balance hero headings; set body line-height around 1.55 and cap long reading widths at 65–72 characters.

**Spacing/layout**

- Base spacing: 4, 8, 12, 16, 24, 32, 48, 64 px. Avoid one-off values unless an optical adjustment is documented.
- Desktop content max width: 1200–1280 px; evidence reading column: 680–760 px.
- Desktop shell rail: 216–232 px, not 260 px, and only if it contains unique navigation.
- Mobile gutters: 16 px; cards should snap with a visible next-card edge and a “Swipe” cue only on first use.
- Minimum touch target: 44 × 44 px. Compact density should come from information design, not tiny labels.

### 6. Motion requirements

- Spend motion on one orchestrated moment: the Proof Waveform resolving from overview to sourced evidence when a case opens.
- Default transitions: 120–180 ms for hover/focus, 200–260 ms for drawers/page transitions; transform and opacity only. No `transition: all`.
- No idle pulse, continuous animation, autoplay sound, or animated decoration. The initial screen should be still.
- Hover never reveals the only route to an action. Touch and keyboard receive equivalent controls.
- `prefers-reduced-motion: reduce` removes waveform drawing, parallax, smooth scrolling, and toast motion while preserving the final state instantly.
- Any narrated/media tour longer than 5 seconds exposes pause/stop, captions/transcript, duration, and a non-media alternative.

### 7. Accessibility and responsive requirements

- Use `<a>`/router links for navigation and `<button>` for actions; never clickable `<div>` and never nested interactive controls.
- Add “Skip to main content,” named Primary/Portfolio/Mobile navigation landmarks, hierarchical headings, and route focus with a designed `:focus-visible` ring.
- Every input has a visible label, `name`, appropriate `autocomplete`, and a clear focus state. Do not autofocus search on mobile.
- Toasts/status changes use `aria-live="polite"`. Menus, drawers, and mobile sheets manage focus, Escape, and background inertness.
- All icon-only actions have accessible names; decorative icons/art are hidden from assistive technology. Meaningful artifacts receive concise alt text and an adjacent text explanation.
- At 320–430 px, CV and contact actions remain in the first viewport. No fixed chrome may cover content or the focused element. Respect safe-area insets.
- Verify 200% and 400% zoom/reflow, browser text enlargement, long names, no-JS CV/contact access, and keyboard-only use.

### 8. Performance requirements

- First-view transfer target: **≤ 1.0 MiB total**, including images and fonts.
- Initial JavaScript: **≤ 150 kB gzip**; the current 125.7 kB transfer is a sensible ceiling, not a reason to add a large component system.
- Above-fold image budget: ≤ 350 kB total; full first-route image budget: ≤ 700 kB.
- Use width/height or `aspect-ratio`, `srcset`/`sizes`, AVIF/WebP, eager/high-priority loading only for the LCP image, and lazy loading below the fold.
- Target mobile p75 Core Web Vitals: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- No idle animation and no audio context creation until a user explicitly requests genuine audio.

---

## Exactly three layout / information-architecture options

### Option 1 — **Artist profile → proof tracks → conversion** (recommended)

**Desktop structure**

```text
Compact rail       Main
Profile             Artist hero: role + proposition + proof + CV/Email/LinkedIn
Selected work       3 selected proof releases
Experience          Core strengths as sourced track rows
Awards              Experience timeline / discography
Search              Awards + credentials
                     Contact encore
Optional compact “Now viewing / Start highlight tour” strip
```

**Mobile structure**

```text
Darshify mark + menu
Name / role / proposition
Download CV + Email + LinkedIn
3 proof points
Selected work (vertical cards)
Experience
Skills / awards
Contact encore
Compact sticky CV/Email bar after hero exits
```

**Tradeoffs:** This option gives recruiters the fastest comprehension and conversion while preserving the artist-page, release, track, library, search, and dark-player vocabulary. It requires the biggest departure from the current full Spotify shell and makes the playful simulation secondary. That is precisely why it is recommended.

**Why it wins:** one-scroll recruiter narrative, conversion in the first viewport on every breakpoint, plain-language hierarchy with themed secondary labels, and a natural home for real evidence. It can still feel unmistakably Darshify without pretending to be a complete streaming service.

### Option 2 — **Album casebook**

**Structure:** A compact artist hero leads to 4 “albums” (Experience, Projects, Leadership, Awards). Each album opens a casebook-style release page; tracks are case entries with liner notes, outcomes, artifacts, and contact actions. Search and library remain first-class; the player becomes an optional genuine highlight tour.

**Tradeoffs:** This is the strongest preservation of the Spotify browsing model and scales well when there are many artifacts. It creates more navigation depth: the recruiter's best proof is at least one click away unless the homepage duplicates summaries. It also risks returning to equal-weight shelves unless editorial priority is strictly enforced.

**Best when:** Darshil can supply several high-quality project artifacts and the portfolio is meant for deeper review after an initial application screen.

### Option 3 — **Career Wrapped story**

**Structure:** A scroll-snapped, chapter-based “career wrapped” sequence opens with identity, then real quantified chapters, projects, strengths, and awards; a persistent evidence index allows jumping, and a final contact frame closes the story. Desktop adds a right-side chapter rail; mobile uses linear vertical chapters.

**Tradeoffs:** It has the largest visual impact and could be highly shareable. It is the least recruiter-efficient, most motion-sensitive, hardest to make accessible at 400% zoom, and closest to another recognizable branded gimmick. It should include a prominent “Skip to portfolio” path and a static content mode. Without those, it becomes presentation theatre.

**Best when:** the primary goal is social sharing or event presentation, not the highest possible recruiter scan efficiency.

---

## Desktop and mobile conversion flow

### Desktop conversion flow

1. **0–5 seconds:** See “Darshil Jain,” target role, one-sentence value, 3 real proof points, and Download CV / Email / LinkedIn in the hero/header.
2. **5–20 seconds:** Scan 3 selected releases. Each card exposes one concrete outcome without hover.
3. **20–60 seconds:** Open a proof track. Read Situation → Action → Result, inspect an artifact/source, and return without losing scroll position.
4. **Conversion:** Download CV or contact from the persistent header, evidence page, or final “Encore” section. No action takes more than one click from any primary page.

### Mobile conversion flow

1. **First viewport:** Identity, role, short proposition, one strongest metric, Download CV, and Email are visible at 390 × 844 without scrolling.
2. **First scroll:** Remaining proof points and 2–3 selected projects appear; cards stack vertically and expose outcomes directly.
3. **Evidence:** Tap “Read case” to open a full page or accessible sheet with a clear Back action; artifact text remains readable without pinch zoom.
4. **Conversion:** After the hero exits, a safe-area-aware compact bar provides Download CV and Email. LinkedIn remains in the menu and Contact section. There is no simultaneous player and bottom-navigation stack.

---

## Measurable “10/10” release criteria

A perfect subjective score cannot be guaranteed, but the redesign should not be called 10/10 unless every release gate below passes.

### Recruiter comprehension and conversion

- In a 5-second test with at least 5 target-role reviewers, ≥ 80% can state Darshil's target function and one verified proof point.
- In a 30-second task test, ≥ 80% can identify his strongest relevant project, locate the CV, and find a contact method without prompting.
- Name, target role, proposition, one proof point, Download CV, and Email are visible at both 1440 × 900 and 390 × 844.
- CV and contact are reachable in ≤ 1 interaction from every primary route.
- The first Home view contains at most 3 priority content choices beyond conversion actions; no equal-weight six-tile navigation wall.

### Honesty and evidence

- Zero fabricated listeners, plays, ranks, verification badges, durations, following states, or metaphorical numeric social proof.
- 100% of rendered quantitative claims include a recorded source, period/date, and verification status in the content model.
- Every selected project/role has Situation, Action, Result, and Evidence; any unavailable/confidential evidence is explicitly labelled.
- Every action label matches its behavior in usability testing: “Play” produces media, “Connect” opens a real channel, and “Download CV” downloads the current CV.

### Visual identity and content quality

- Zero generic AI/stock brain, gears, trophy, medal, or chess covers in the priority path.
- 100% of selected-work art is a real/redacted artifact or a fact-derived typographic composition.
- No repeated cover among distinct priority items; no essential title truncates at 320, 390, 768, 1024, or 1440 px.
- The Proof Waveform appears as one coherent signature across hero, cards, and evidence—not as unrelated decorative animation.
- Plain-language labels remain primary; themed EP/LP/track language is secondary and never required for comprehension.

### Accessibility and interaction

- WCAG 2.1 AA contrast passes for all text and controls; automated checks report zero serious/critical Axe violations across all routes.
- 100% of primary actions are keyboard reachable, operable, and visibly focused in logical order; zero opacity-zero focus stops and zero nested interactive elements.
- Skip link, named landmarks, heading hierarchy, input labels, live status announcements, sheet focus management, and reduced-motion behavior pass manual review.
- All flows work at 200% zoom; core content/contact works at 400% reflow and with browser text enlargement.
- 44 × 44 px minimum touch targets, safe-area support, and no fixed element obscuring content or focus at 320–430 px.
- Any audio/tour has pause/stop, captions or transcript, duration, and a no-motion/no-audio alternative.

### Performance and resilience

- Total cold first-view transfer ≤ 1.0 MiB; image transfer ≤ 700 kB; initial JS ≤ 150 kB gzip.
- Mobile p75 LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; Lighthouse mobile scores ≥ 95 for Performance, Accessibility, Best Practices, and SEO on the deployed site.
- All meaningful images have intrinsic dimensions, correct responsive sources, and appropriate loading priority.
- Zero console errors, failed assets, broken deep links, or unlabeled error/empty states across Home, Search, category, case-study, Contact, and unknown routes.
- Reduced motion produces zero idle/continuous animations; no audio context starts without explicit user action.

## Final design direction

Choose **Option 1: Artist profile → proof tracks → conversion**. Preserve Darshify's name, black/green streaming atmosphere, release/track metaphor, search, and the delight of pressing play—but make “play” real, make metrics sourced, make art evidence, and make recruiter conversion the first-class product. The redesign becomes 10/10 by being more Darshil and less Spotify, while still being unmistakably Spotify-themed.
