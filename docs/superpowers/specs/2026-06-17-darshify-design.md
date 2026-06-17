# DARSHIFY — Music-App Portfolio for Darshil Jain

**Date:** 2026-06-17
**Status:** Approved (design phase)
**Owner:** Archit Jain (building for Darshil Jain)

## Summary

A full, interactive **music-streaming-app portfolio** — "DARSHIFY" — that reframes
Darshil Jain's résumé as a music app: skills, roles, projects and achievements are
"tracks" you can play, grouped into playlists/albums, browsable from a Home feed,
a Search page, a Library, an artist page ("This Is Darshil"), and a Liked-Songs
list, all under a persistent **now-playing player bar** with real play/pause/
next/prev/seek/shuffle/repeat and a queue.

**Original build.** Inspired by streaming-app *UI patterns* only. No real brand
name, logo, trademarked icon, copyrighted album art, or song lyrics. Original
wordmark ("DARSHIFY"), original icon set (Unicode/SVG), original color tokens.

## Goals

- The "exact app experience" feel: three-pane shell, browse shelves, detail
  pages, and a working player — but as a portfolio.
- Every résumé item is a playable "track" with sensible metadata (duration,
  plays, context).
- Desktop-first (the app is a desktop layout), gracefully responsive to mobile.
- Live, shareable URL via GitHub + Vercel.

## Non-Goals (YAGNI)

- No real music/audio streaming or external APIs; "audio" is an optional original
  Web-Audio ambient tone, off by default.
- No accounts, backend, or persistence beyond `localStorage` (liked items, volume).
- No use of any real brand's name, logo, icon, font, or color-as-trademark.

## Decisions (locked)

- **Player:** fully interactive — click any track/card to play; now-playing bar
  updates; progress animates and is seekable; play/pause/next/prev/shuffle/repeat;
  a queue. Optional ambient audio per play (original Web Audio), off by default.
- **Pages:** Home (browse), Search (+ genre tiles), Library, Playlist/Album
  detail, Artist ("This Is Darshil"), Liked Songs. Plus a Queue panel and a
  right-hand Now-Playing panel.
- **Brand:** DARSHIFY (original wordmark + play-glyph icon).
- **"Every feature we can think of"** (superset, all original):
  time-aware greeting; horizontally-scrolling shelves; quick-pick grid; library
  filter pills + sort + in-library search; track hover (row index → play button);
  like/unlike (persisted); seekable progress + volume (persisted); shuffle &
  repeat (off/all/one); queue view; right Now-Playing panel with "About the
  artist"; keyboard shortcuts (space, ←/→, etc.); context menu on tracks
  (Add to queue / Copy link / Go to artist); toast on actions; route-based
  navigation with back/forward.

## Visual Direction

Near-black layered surfaces (`#000` shell, `#121212` panels, `#181818` cards,
`#282828` hovers), white text, **vivid green accent** (`#1ed760`, defined as our
own `--color-accent`). Per-playlist gradient "covers" (CSS gradients, original).
Type: a clean grotesque (e.g. **Figtree**/**Archivo**, OFL) for UI; heavy weights
for headers. Motion: card hover-lift + reveal play button, page fade/slide,
now-playing art crossfade, progress easing, toast slide-ins. Density and polish
matched to the reference pattern.

## Architecture

```
src/
├─ main.tsx · App.tsx (router) · index.css
├─ data/library.ts          # ALL content as tracks/playlists/artist (source of truth)
│  └─ library.test.ts
├─ player/
│  ├─ engine.ts             # PURE: queue/next/prev/shuffle/repeat/formatTime
│  │  └─ engine.test.ts
│  ├─ PlayerContext.tsx     # state: track, isPlaying, queue, progress, vol, like
│  └─ useAmbient.ts         # original Web Audio tone (opt-in)
├─ lib/ useReducedMotion.ts(+test) · useLocalStorage.ts · format.ts(+test)
├─ shell/
│  ├─ AppShell.tsx          # grid: sidebar | main(Outlet) | (now-playing panel); bottom PlayerBar
│  ├─ Sidebar.tsx · TopBar.tsx · PlayerBar.tsx · NowPlayingPanel.tsx · QueuePanel.tsx
│  ├─ TrackRow.tsx · MediaCard.tsx · Shelf.tsx · PlayButton.tsx · Toast.tsx
├─ pages/ Home · Search · Library · PlaylistPage · ArtistPage · LikedSongs · NotFound
└─ icons/ (original inline SVGs)
```

**Pure engine** (`engine.ts`): given a queue + index + repeat/shuffle mode,
computes next/prev index, shuffled order, and `formatTime(sec)`. Fully unit-tested,
no React. `PlayerContext` wraps it with React state + the progress timer (rAF),
volume/like persistence, and exposes `play(track, contextTracks)`, `toggle`,
`next`, `prev`, `seek`, `setVolume`, `toggleLike`, `cycleRepeat`, `toggleShuffle`,
`enqueue`. Pages/components consume the context; they hold no player logic.

**Data flow:** `data/library.ts` holds the artist, all tracks, playlists/albums,
genres, and the liked/achievements set. Pages render from it; the player operates
on track objects from it. One file to edit content.

## Data Model

```ts
Track { id, title, subtitle, kind: "skill"|"role"|"project"|"achievement", durationSec, plays, detail, gradient }
Playlist { id, title, kind: "EP"|"LP"|"Playlist", description, gradient, trackIds[] }
Artist { name, tagline, monthlyListeners, about, gradient }
Genre { id, title, gradient }  // search tiles
```

Mapping: skills → "Top Skills" playlist; roles → "Experience (EP)"; projects →
"Projects (LP)"; achievements → "Liked Songs"; certifications → an "Extended
Play" album; everything also surfaced on Home shelves and the Artist page's
"Popular".

## Quality & Resilience

- **Testing (Vitest):** engine (next/prev at ends, repeat-one/all, shuffle
  determinism via seed, formatTime), data integrity (every playlist trackId
  resolves; artist present), like persistence reducer, TrackRow render, Home
  renders shelves.
- **Accessibility:** all controls are real buttons with aria-labels; player bar
  is a labelled region; sliders are `role=slider` with keyboard; route changes
  move focus to `<h1>`; `prefers-reduced-motion` disables hover-lift/auto-scroll/
  art crossfade; WCAG AA contrast (dark theme passes easily).
- **Resilience:** unknown route → NotFound; empty queue → controls disabled;
  audio opt-in (autoplay-safe); broken nothing (all CSS art).
- **Performance:** route-level code-splitting; lazy NowPlaying/Queue panels;
  Lighthouse ≥ 90.
- **Deploy:** GitHub + Vercel with SPA rewrite.

## Content (same résumé data as the other portfolios)

Darshil Jain · BBA (B&I) 2024–27 · CGPA 9.39. Roles: Figmenta (Ops), PSR
Compliance (Ops), MJ Marketing/LOR (HR). Projects: ZautoAI, IIT-G capstone,
Haldiram's, Zomato. Leadership: Igniters Club (0→80+, Converge 1,000+, ₹50K+).
Achievements: IIM-B finalist, IIM-C 4th, BPlan Showdown winner, IIT-G Top 10%.
Certs: Hult Prize bootcamp, Winter Consulting, BI & Data Analysis (IIM-B).
Contact: darshijain0809@gmail.com · +91 9268264843 · linkedin.com/in/darshil-jain08.
CV PDF served at /Darshil_Jain_Resume.pdf.

## Risks / Open Items

- **IP discipline:** keep wordmark/icons/colors original; never render a real
  logo or brand name in the product. (Conversation may reference the inspiration.)
- **Scope:** large. Build in phases; each phase ships a working slice.
- **Font licensing:** OFL/permissive only, bundled.
