# WRAPPED — Story-Slide Portfolio for Darshil Jain

**Date:** 2026-06-17
**Status:** Approved (design phase)
**Owner:** Archit Jain (building for Darshil Jain)

## Summary

A vivid, full-screen **story-slide portfolio** for Darshil Jain — inspired by the
"year in review / Wrapped" aesthetic (bold duotone gradients, huge kinetic type,
count-up numbers, story progress bars), reframing his résumé as a playful annual
recap. **Original build — no Spotify logos, trademarks, brand names, or copied
UI.** It is its own app, separate from the terminal and race-car portfolios.

## Goals

- A loud, memorable, shareable recap that still communicates real substance.
- Map résumé → Wrapped tropes: top skills = "top songs", orgs = "top artists",
  projects = "top album", personality = "your genre", awards = "you went platinum".
- Mobile-first, presentable live (auto-advance + manual control).
- Live, shareable URL via GitHub + Vercel.

## Non-Goals (YAGNI)

- No real audio streaming, no backend, no accounts.
- No use of the Spotify name, logo, fonts, colors-as-trademark, or any brand asset.
- No multi-route SPA — a single story player with an ordered slide deck.

## Decisions (locked)

- **Format:** full-screen vertical **story slides** — auto-advance, tap/click
  zones (left=back, right=next), keyboard ←/→/space, hold-to-pause, story
  progress bars on top.
- **Tone:** full Wrapped energy — playful copy, emoji, confetti moments, big
  animated count-up numbers.
- **Extras:** (1) shareable **summary card** downloadable as PNG; (2) **résumé
  PDF** download; (3) **sound toggle** (ambient, off by default); (4)
  **AI-generated backdrops** for a few slides, with CSS-gradient fallback.

## Visual Direction

Each slide owns a bold duotone gradient (rotating hues: spotify-adjacent green,
hot magenta→violet, amber→orange, cyan→blue, etc. — chosen as an original
palette, not a brand palette). Display type: a heavy geometric sans (e.g.
**Clash Display** or **Archivo Expanded**, free for this use) for giant
headlines; clean sans for body. Motion: staggered entrances, number count-ups,
list reveals, subtle parallax on the gradient, confetti on celebratory slides.
Optional AI backdrops add abstract grain/blob textures behind the gradient.

## Slide Deck (résumé → Wrapped)

1. **Intro** — "Your Year, Wrapped · 2024–26", Darshil Jain, Strategy & Operations. Tap to begin.
2. **Top Skills** — countdown list of the top 5 skills (with rating as "plays").
3. **Top Artists** — the orgs he worked with: Figmenta, PSR Compliance, MJ Marketing, Igniters Club.
4. **Big Stat I** — "You screened 500+ resumes" (with a cheeky percentile line).
5. **Big Stat II** — "1,000+ showed up to Converge 2026" / "100+ interviews run".
6. **Your Genre** — personality archetype ("Strategy & Operations") with an aura of descriptors (Analytical · Driven · Builder).
7. **Top Album** — projects as a tracklist: ZautoAI, IIT-G Capstone, Haldiram's, Zomato Dashboard.
8. **You Went Platinum** — achievements reel: IIM-B finalist, IIM-C 4th, BPlan winner, IIT-G Top 10%.
9. **Community Builder** — leadership: founded Igniters Club 0→80+, Converge ₹50K+.
10. **Summary / Share** — recap card (top skill, top org, genre, headline numbers) + DOWNLOAD CV + SAVE CARD (PNG) + links to his other portfolios.

## Architecture

```
src/
├─ main.tsx · App.tsx · index.css
├─ data/wrapped.ts            # ALL content + ordered slide list (source of truth)
│  └─ wrapped.test.ts
├─ lib/
│  ├─ player.ts               # pure slide-index logic (next/prev/clamp/progress)
│  │  └─ player.test.ts
│  ├─ useReducedMotion.ts (+ test)
│  └─ useStoryPlayer.ts       # timer/auto-advance/pause hook around player.ts
├─ story/
│  ├─ StoryPlayer.tsx         # deck host: progress bars, tap zones, keyboard, sound
│  ├─ ProgressBars.tsx
│  ├─ Slide.tsx               # shared slide frame (gradient + motion wrapper)
│  ├─ CountUp.tsx             # animated number
│  └─ Confetti.tsx            # canvas-confetti wrapper (reduced-motion aware)
├─ slides/                    # one component per slide (10)
│  ├─ Intro · TopSkills · TopArtists · BigStatI · BigStatII
│  ├─ Genre · TopAlbum · Platinum · Community · Summary
├─ audio/useAmbient.ts        # Web Audio ambient pad (original, no asset)
└─ share/saveCard.ts          # html-to-image PNG export of the summary card
```

**Slide engine:** `player.ts` is pure (index math, clamping, progress %),
unit-tested. `useStoryPlayer` wraps it with the auto-advance timer, pause, and
reduced-motion (no auto-advance when reduced). `StoryPlayer` renders the active
slide + progress bars + controls. Slides are dumb, data-driven components.

**Data flow:** `data/wrapped.ts` holds Darshil's facts AND the ordered slide
registry (id → component key, accent gradient, duration). One file to edit.

## Tech Stack

- **Vite + React + TypeScript + Tailwind v4**
- **motion** (Framer Motion) — slide transitions, staggers, count-ups
- **canvas-confetti** — celebratory bursts (gated by reduced-motion)
- **html-to-image** — export the summary card to PNG
- **Web Audio API** — original ambient pad for the sound toggle (no audio asset, no licensing)
- **gpt-image-bridge skill** (optional, build-time) — generate a few abstract
  backdrop images into `public/bg/`; if unavailable, CSS gradients are the fallback
- **Vitest + Testing Library**
- Display font: a free (OFL/permissive) heavy geometric sans, bundled locally.

## Quality & Resilience

- **Testing:** player math (next/prev/clamp/progress, wrap disabled at ends),
  data integrity (10 slides registered, top-5 skills), CountUp target, Summary
  render, useReducedMotion.
- **Accessibility:** keyboard controls; each slide has a heading + readable
  contrast; `prefers-reduced-motion` disables auto-advance, count-up, confetti,
  parallax (content shown immediately); sound off by default; respects pause.
- **Resilience:** AI backdrops optional — missing images fall back to CSS
  gradients; PNG export failure shows a copyable text recap; audio is opt-in.
- **Performance:** confetti/motion lazy where heavy; images compressed; Lighthouse ≥ 90.
- **Deploy:** GitHub + Vercel.

## Content (from résumé — same data as the other portfolios)

Darshil Jain, BBA (B&I) 2024–27, Maharaja Surajmal Institute (GGSIPU), CGPA 9.39.
Internships: Figmenta (Ops), PSR Compliance (Ops), MJ Marketing/LOR (HR).
Projects: ZautoAI, IIT-G capstone (Top 10%), Haldiram's expansion, Zomato
dashboard. Leadership: Founder & President, Igniters Club (0→80+, Converge 2026:
1,000+, ₹50k+). Achievements: IIM-B BPlan finalist, IIM-C Product Decode 4th,
BPlan Showdown winner, IIT-G Top 10%. Certs: Hult Prize bootcamp (IIT Bombay),
Winter Consulting, BI & Data Analysis (IIM Bangalore). Contact:
darshijain0809@gmail.com, +91 9268264843, https://www.linkedin.com/in/darshil-jain08/.

## Risks / Open Items

- **gpt-image-bridge availability** (needs codex CLI + OpenAI auth) — treat AI
  backdrops as enhancement; ship CSS-gradient fallback so the build never blocks.
- **Font licensing** — use only OFL/permissive display fonts, bundled.
- **Autoplay audio policy** — ambient starts only after the first user gesture
  ("tap to begin"); off by default.
