# WRAPPED Story-Slide Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vivid, full-screen "Wrapped" story-slide portfolio for Darshil Jain — auto-advancing slides, count-up stats, confetti, a shareable PNG card, résumé download, sound toggle, and optional AI backdrops — deployed to Vercel.

**Architecture:** Vite + React + TS SPA. A pure, unit-tested slide-index engine (`player.ts`) drives a `useStoryPlayer` timer hook; `StoryPlayer` renders the active slide + progress bars + controls. All content + the ordered slide registry live in `src/data/wrapped.ts`. Slides are dumb, data-driven, motion-animated components.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind v4, framer-motion, canvas-confetti, html-to-image, Web Audio API, Vitest + Testing Library. Optional: gpt-image-bridge for backdrops.

**Working dir:** `/Users/architjain/wrapped-portfolio` (repo already initialized; spec committed on `main`). Create a build branch first: `git checkout -b build/wrapped`.

---

## File Structure

```
src/
├─ main.tsx · App.tsx · index.css
├─ data/wrapped.ts (+ wrapped.test.ts)
├─ lib/ player.ts(+test) · useReducedMotion.ts(+test) · useStoryPlayer.ts
├─ story/ StoryPlayer.tsx · ProgressBars.tsx · Slide.tsx · CountUp.tsx(+test) · Confetti.tsx
├─ slides/ Intro · TopSkills · TopArtists · BigStatI · BigStatII · Genre · TopAlbum · Platinum · Community · Summary
├─ audio/useAmbient.ts
└─ share/saveCard.ts
public/ Darshil_Jain_Resume.pdf · fonts/Display.ttf · bg/* (optional AI backdrops)
```

---

## Task 1: Scaffold + Tailwind v4 + Vitest + deps + font

**Files:** `package.json`, `vite.config.ts`, `src/index.css`, `src/test/setup.ts`, `public/*`

- [ ] **Step 1: Scaffold into temp, merge, install**

```bash
cd /Users/architjain/wrapped-portfolio
git checkout -b build/wrapped
npm create vite@latest _scaffold -- --template react-ts
rsync -a --exclude='.gitignore' _scaffold/ ./ && rm -rf _scaffold
npm install
npm install framer-motion canvas-confetti html-to-image
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom @types/canvas-confetti
```

- [ ] **Step 2: vite.config.ts**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { globals: true, environment: "jsdom", setupFiles: "./src/test/setup.ts" },
});
```

Create `src/test/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

Add scripts to `package.json`: `"test": "vitest run --passWithNoTests"`, `"test:watch": "vitest"`. Set `"name": "wrapped-portfolio"`.

- [ ] **Step 3: Résumé + display font**

```bash
cp "/Users/architjain/Downloads/Darshil jain Resume.pdf" public/Darshil_Jain_Resume.pdf
mkdir -p public/fonts
curl -sfL -o public/fonts/Display.ttf "https://github.com/google/fonts/raw/main/ofl/archivo/Archivo%5Bwdth,wght%5D.ttf"
```
If the font download fails, the `system-ui` fallback in CSS applies — proceed.

- [ ] **Step 4: tokens — replace `src/index.css`**

```css
@import "tailwindcss";

@theme {
  --color-ink: #0b0b0f;
  --font-display: "Display", system-ui, sans-serif;
  --font-body: ui-sans-serif, system-ui, sans-serif;
}
@font-face {
  font-family: "Display";
  src: url("/fonts/Display.ttf") format("truetype");
  font-weight: 100 900; font-display: swap;
}
html, body, #root { margin: 0; height: 100%; }
body { background: var(--color-ink); color: #fff; font-family: var(--font-body); overflow: hidden; }
#root { overflow: hidden; }
```

- [ ] **Step 5: Verify + commit**

Run `npm test` (exit 0) and `npx tsc --noEmit` (clean).
```bash
git add -A && git commit -m "chore: scaffold vite+tailwind+vitest for wrapped portfolio"
```

---

## Task 2: Content + slide registry (`data/wrapped.ts`) — TDD

**Files:** `src/data/wrapped.ts`, `src/data/wrapped.test.ts`

- [ ] **Step 1: Failing test** — `src/data/wrapped.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { wrapped, slides } from "./wrapped";

describe("wrapped data", () => {
  it("identifies Darshil and his genre", () => {
    expect(wrapped.driver.name).toBe("Darshil Jain");
    expect(wrapped.genre.title.length).toBeGreaterThan(0);
  });
  it("has a top-5 skills countdown and 4 album tracks", () => {
    expect(wrapped.topSkills.length).toBe(5);
    expect(wrapped.projects.length).toBe(4);
  });
  it("registers exactly 10 slides ending in summary, each with a gradient + duration", () => {
    expect(slides.length).toBe(10);
    expect(slides[slides.length - 1].id).toBe("summary");
    for (const s of slides) {
      expect(s.gradient.length).toBeGreaterThan(0);
      expect(s.durationMs).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `src/data/wrapped.ts`:

```ts
export type SlideId =
  | "intro" | "skills" | "artists" | "statResumes" | "statConverge"
  | "genre" | "album" | "platinum" | "community" | "summary";

export interface SlideDef { id: SlideId; gradient: string; durationMs: number; }

export const slides: SlideDef[] = [
  { id: "intro",       gradient: "linear-gradient(160deg,#1db954,#0a7d43)", durationMs: 5000 },
  { id: "skills",      gradient: "linear-gradient(160deg,#ff4d6d,#7b2ff7)", durationMs: 7000 },
  { id: "artists",     gradient: "linear-gradient(160deg,#36c6ff,#2536ff)", durationMs: 6000 },
  { id: "statResumes", gradient: "linear-gradient(160deg,#ffd23f,#ff7a00)", durationMs: 5000 },
  { id: "statConverge",gradient: "linear-gradient(160deg,#f857a6,#ff5858)", durationMs: 5000 },
  { id: "genre",       gradient: "linear-gradient(160deg,#00f5a0,#00d9f5)", durationMs: 6000 },
  { id: "album",       gradient: "linear-gradient(160deg,#8e2de2,#4a00e0)", durationMs: 7000 },
  { id: "platinum",    gradient: "linear-gradient(160deg,#c9d6ff,#8a9bff)", durationMs: 6000 },
  { id: "community",   gradient: "linear-gradient(160deg,#f7971e,#ffd200)", durationMs: 6000 },
  { id: "summary",     gradient: "linear-gradient(160deg,#1db954,#191414)", durationMs: 12000 },
];

export const wrapped = {
  driver: { name: "Darshil Jain", title: "Strategy & Operations", years: "2024–26",
    degree: "BBA (B&I)", institute: "Maharaja Surajmal Institute, GGSIPU", cgpa: "9.39" },
  // top skills as a countdown (1 = most "played")
  topSkills: [
    { rank: 1, name: "Market Research", plays: 92 },
    { rank: 2, name: "Competitive Analysis", plays: 90 },
    { rank: 3, name: "Strategic Analysis", plays: 88 },
    { rank: 4, name: "Stakeholder Management", plays: 87 },
    { rank: 5, name: "Excel · Notion", plays: 90 },
  ],
  artists: [
    { name: "Figmenta", note: "Operations · Asia team" },
    { name: "PSR Compliance", note: "Operations · 70+ clients" },
    { name: "MJ Marketing", note: "Human Resources" },
    { name: "Igniters Club", note: "Founder & President" },
  ],
  stats: {
    resumes: 500, resumesLine: "More than 98% of interns. You don't stop. 🔥",
    converge: 1000, converseLine: "Converge 2026 — your biggest show yet. 🎤",
    interviews: 100, sponsorship: "₹50K+",
  },
  genre: { title: "Strategy & Operations",
    aura: ["Analytical", "Driven", "Builder", "Closer"],
    blurb: "Your sound this year: research-led, execution-obsessed, community-powered." },
  projects: [
    { track: "ZautoAI Consulting", meta: "GTM · pricing · finalist" },
    { track: "IIT-G Capstone", meta: "telemedicine · Top 10%" },
    { track: "Haldiram's Expansion", meta: "global GTM case" },
    { track: "Zomato Dashboard", meta: "Looker Studio · 5+ metrics" },
  ],
  achievements: [
    "Finalist — IIM Bangalore Business Plan Championship",
    "4th — IIM Calcutta Product Decode",
    "Winner — BPlan Showdown",
    "Top 10% — IIT Guwahati Consulting Program",
  ],
  leadership: { line1: "You built a community from 0 → 80+ members.",
    line2: "Led Converge 2026: 1,000+ people, ₹50K+ raised, 17-member team." },
  contact: { email: "darshijain0809@gmail.com", phone: "+91 9268264843",
    linkedin: "https://www.linkedin.com/in/darshil-jain08/" },
};
```

- [ ] **Step 4: Run — expect PASS. Step 5: Commit** `git add -A && git commit -m "feat: add wrapped data + slide registry (TDD)"`

---

## Task 3: Slide-index engine (`lib/player.ts`) — TDD

**Files:** `src/lib/player.ts`, `src/lib/player.test.ts`

- [ ] **Step 1: Failing test** — `src/lib/player.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { nextIndex, prevIndex, clampIndex, barProgress } from "./player";

describe("player index math", () => {
  it("advances and clamps at the end (no wrap)", () => {
    expect(nextIndex(0, 10)).toBe(1);
    expect(nextIndex(9, 10)).toBe(9);
  });
  it("retreats and clamps at the start", () => {
    expect(prevIndex(5, 10)).toBe(4);
    expect(prevIndex(0, 10)).toBe(0);
  });
  it("clamps arbitrary indices", () => {
    expect(clampIndex(-3, 10)).toBe(0);
    expect(clampIndex(99, 10)).toBe(9);
  });
  it("computes per-bar progress: past=100, future=0, current=elapsed", () => {
    expect(barProgress(2, 0, 40)).toBe(100); // bar before active
    expect(barProgress(2, 5, 40)).toBe(0);   // bar after active
    expect(barProgress(2, 2, 40)).toBe(40);  // active bar
    expect(barProgress(2, 2, 150)).toBe(100);// clamps
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `src/lib/player.ts`:

```ts
export const clampIndex = (i: number, n: number): number => Math.max(0, Math.min(n - 1, i));
export const nextIndex = (i: number, n: number): number => clampIndex(i + 1, n);
export const prevIndex = (i: number, n: number): number => clampIndex(i - 1, n);

// progress (0–100) for the progress bar of `barIdx` given the `activeIdx` and current `elapsedPct`.
export const barProgress = (activeIdx: number, barIdx: number, elapsedPct: number): number => {
  if (barIdx < activeIdx) return 100;
  if (barIdx > activeIdx) return 0;
  return Math.max(0, Math.min(100, elapsedPct));
};
```

- [ ] **Step 4: Run — expect PASS. Step 5: Commit** `git commit -am "feat: add pure slide-index engine (TDD)"`

---

## Task 4: `useReducedMotion` — TDD

**Files:** `src/lib/useReducedMotion.ts`, `src/lib/useReducedMotion.test.ts`

- [ ] **Step 1: Failing test** — `src/lib/useReducedMotion.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "./useReducedMotion";

describe("useReducedMotion", () => {
  it("returns true when reduce is preferred", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"), media: q, addEventListener: () => {}, removeEventListener: () => {},
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `src/lib/useReducedMotion.ts`:

```ts
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
```

- [ ] **Step 4: Run — expect PASS. Step 5: Commit** `git commit -am "feat: add useReducedMotion (TDD)"`

---

## Task 5: `useStoryPlayer` timer hook

**Files:** `src/lib/useStoryPlayer.ts`

- [ ] **Step 1: Implement** — `src/lib/useStoryPlayer.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { slides } from "../data/wrapped";
import { nextIndex, prevIndex, clampIndex } from "./player";
import { useReducedMotion } from "./useReducedMotion";

export function useStoryPlayer() {
  const n = slides.length;
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [elapsedPct, setElapsedPct] = useState(0);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  const goNext = useCallback(() => { setElapsedPct(0); setIndex((i) => nextIndex(i, n)); }, [n]);
  const goPrev = useCallback(() => { setElapsedPct(0); setIndex((i) => prevIndex(i, n)); }, [n]);
  const goto = useCallback((i: number) => { setElapsedPct(0); setIndex(clampIndex(i, n)); }, [n]);

  useEffect(() => {
    if (!started || paused || reduced) return;
    const dur = slides[index].durationMs;
    startRef.current = performance.now();
    const tick = (t: number) => {
      const pct = ((t - startRef.current) / dur) * 100;
      if (pct >= 100) { setElapsedPct(100); setIndex((i) => nextIndex(i, n)); setElapsedPct(0); return; }
      setElapsedPct(pct);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [index, paused, started, reduced, n]);

  return {
    index, elapsedPct, paused, started, reduced, total: n,
    goNext, goPrev, goto,
    start: () => setStarted(true),
    setPaused,
    atEnd: index === n - 1,
  };
}
```

- [ ] **Step 2: Typecheck + commit**: `npx tsc --noEmit && git add -A && git commit -m "feat: add story player timer hook"`

---

## Task 6: `CountUp` — TDD

**Files:** `src/story/CountUp.tsx`, `src/story/CountUp.test.tsx`

- [ ] **Step 1: Failing test** — `src/story/CountUp.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountUp } from "./CountUp";

describe("CountUp", () => {
  it("shows the target immediately when reduced motion is on", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: true, media: q, addEventListener: () => {}, removeEventListener: () => {},
    }));
    render(<CountUp to={500} />);
    expect(screen.getByText("500")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `src/story/CountUp.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useReducedMotion } from "../lib/useReducedMotion";

export function CountUp({ to, durationMs = 1400, suffix = "" }: { to: number; durationMs?: number; suffix?: string }) {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(reduced ? to : 0);
  useEffect(() => {
    if (reduced) { setVal(to); return; }
    let raf = 0; const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs, reduced]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}
```

- [ ] **Step 4: Run — expect PASS. Step 5: Commit** `git commit -am "feat: add CountUp (TDD)"`

---

## Task 7: `Slide` frame, `ProgressBars`, `Confetti`

**Files:** `src/story/Slide.tsx`, `src/story/ProgressBars.tsx`, `src/story/Confetti.tsx`

- [ ] **Step 1: Slide** — `src/story/Slide.tsx`:

```tsx
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Slide({ gradient, bg, children }: { gradient: string; bg?: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute inset-0 flex flex-col justify-center px-7 md:px-16 overflow-hidden"
      style={{ background: gradient }}
    >
      {bg && <img src={bg} aria-hidden alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay" />}
      <div className="relative z-10 max-w-3xl">{children}</div>
    </motion.section>
  );
}
```

- [ ] **Step 2: ProgressBars** — `src/story/ProgressBars.tsx`:

```tsx
import { slides } from "../data/wrapped";
import { barProgress } from "../lib/player";

export function ProgressBars({ index, elapsedPct }: { index: number; elapsedPct: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex gap-1.5 p-3">
      {slides.map((s, i) => (
        <div key={s.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${barProgress(index, i, elapsedPct)}%` }} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Confetti** — `src/story/Confetti.tsx`:

```tsx
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useReducedMotion } from "../lib/useReducedMotion";

export function Confetti() {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
  }, [reduced]);
  return null;
}
```

- [ ] **Step 4: Typecheck + commit**: `npx tsc --noEmit && git add -A && git commit -m "feat: add Slide frame, ProgressBars, Confetti"`

---

## Task 8: Slides 1–9 (Intro, TopSkills, TopArtists, BigStatI, BigStatII, Genre, TopAlbum, Platinum, Community)

**Files:** one component each in `src/slides/`.

- [ ] **Step 1: Intro** — `src/slides/Intro.tsx`:

```tsx
import { motion } from "framer-motion";
import { wrapped } from "../data/wrapped";

export function Intro() {
  const d = wrapped.driver;
  return (
    <div className="text-[#04210f]">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-sm font-extrabold tracking-[0.3em] opacity-70">{d.years}</motion.div>
      <motion.h1 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
        className="font-display font-black leading-[0.9] text-6xl md:text-8xl mt-3">YOUR YEAR,<br />WRAPPED</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-6 text-xl font-bold">{d.name} · {d.title}</motion.p>
      <p className="opacity-70 text-sm mt-1">{d.degree} · {d.institute}</p>
    </div>
  );
}
```

- [ ] **Step 2: TopSkills** — `src/slides/TopSkills.tsx`:

```tsx
import { motion } from "framer-motion";
import { wrapped } from "../data/wrapped";

export function TopSkills() {
  return (
    <div className="text-white">
      <div className="text-sm font-extrabold tracking-[0.2em] opacity-90">YOUR TOP SKILLS</div>
      <ol className="mt-6 space-y-3">
        {wrapped.topSkills.map((s, i) => (
          <motion.li key={s.name} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.15 }} className="flex items-baseline gap-4">
            <span className="font-display font-black text-3xl md:text-5xl opacity-50 w-12">{s.rank}</span>
            <span className="font-display font-bold text-2xl md:text-4xl">{s.name}</span>
          </motion.li>
        ))}
      </ol>
      <p className="mt-6 text-sm opacity-80">#1 on repeat all year ★</p>
    </div>
  );
}
```

- [ ] **Step 3: TopArtists** — `src/slides/TopArtists.tsx`:

```tsx
import { motion } from "framer-motion";
import { wrapped } from "../data/wrapped";

export function TopArtists() {
  return (
    <div className="text-white">
      <div className="text-sm font-extrabold tracking-[0.2em] opacity-90">YOUR TOP ARTISTS</div>
      <div className="mt-6 space-y-4">
        {wrapped.artists.map((a, i) => (
          <motion.div key={a.name} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.15 }}>
            <div className="font-display font-bold text-2xl md:text-4xl">{a.name}</div>
            <div className="opacity-80 text-sm">{a.note}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: BigStatI** — `src/slides/BigStatI.tsx`:

```tsx
import { wrapped } from "../data/wrapped";
import { CountUp } from "../story/CountUp";

export function BigStatI() {
  return (
    <div className="text-[#2a1500]">
      <div className="text-sm font-extrabold tracking-[0.2em] opacity-80">YOU SCREENED</div>
      <div className="font-display font-black leading-[0.85] text-7xl md:text-9xl mt-2">
        <CountUp to={wrapped.stats.resumes} suffix="+" />
      </div>
      <div className="font-display font-extrabold text-2xl mt-2">resumes this year</div>
      <p className="mt-4 text-base font-semibold opacity-80 max-w-md">{wrapped.stats.resumesLine}</p>
    </div>
  );
}
```

- [ ] **Step 5: BigStatII** — `src/slides/BigStatII.tsx`:

```tsx
import { wrapped } from "../data/wrapped";
import { CountUp } from "../story/CountUp";

export function BigStatII() {
  return (
    <div className="text-white">
      <div className="text-sm font-extrabold tracking-[0.2em] opacity-90">YOUR BIGGEST SHOW</div>
      <div className="font-display font-black leading-[0.85] text-7xl md:text-9xl mt-2">
        <CountUp to={wrapped.stats.converge} suffix="+" />
      </div>
      <div className="font-display font-extrabold text-2xl mt-2">people at Converge 2026</div>
      <p className="mt-4 text-base font-semibold opacity-90 max-w-md">{wrapped.stats.converseLine}</p>
    </div>
  );
}
```

- [ ] **Step 6: Genre** — `src/slides/Genre.tsx`:

```tsx
import { motion } from "framer-motion";
import { wrapped } from "../data/wrapped";

export function Genre() {
  const g = wrapped.genre;
  return (
    <div className="text-[#062b22]">
      <div className="text-sm font-extrabold tracking-[0.2em] opacity-80">YOUR GENRE</div>
      <motion.h2 initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="font-display font-black text-5xl md:text-7xl mt-3">{g.title}</motion.h2>
      <div className="flex flex-wrap gap-2 mt-5">
        {g.aura.map((a, i) => (
          <motion.span key={a} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className="px-4 py-1.5 rounded-full bg-black/20 font-bold text-sm">{a}</motion.span>
        ))}
      </div>
      <p className="mt-5 text-base font-semibold opacity-80 max-w-lg">{g.blurb}</p>
    </div>
  );
}
```

- [ ] **Step 7: TopAlbum** — `src/slides/TopAlbum.tsx`:

```tsx
import { motion } from "framer-motion";
import { wrapped } from "../data/wrapped";

export function TopAlbum() {
  return (
    <div className="text-white">
      <div className="text-sm font-extrabold tracking-[0.2em] opacity-90">YOUR TOP ALBUM · PROJECTS</div>
      <div className="mt-6 space-y-3">
        {wrapped.projects.map((p, i) => (
          <motion.div key={p.track} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.12 }} className="flex items-baseline gap-3">
            <span className="opacity-60 font-display font-black w-8">{i + 1}</span>
            <div>
              <div className="font-display font-bold text-xl md:text-3xl">{p.track}</div>
              <div className="opacity-80 text-sm">{p.meta}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Platinum** — `src/slides/Platinum.tsx`:

```tsx
import { motion } from "framer-motion";
import { wrapped } from "../data/wrapped";
import { Confetti } from "../story/Confetti";

export function Platinum() {
  return (
    <div className="text-[#1a1a2e]">
      <Confetti />
      <div className="text-sm font-extrabold tracking-[0.2em] opacity-80">YOU WENT PLATINUM</div>
      <h2 className="font-display font-black text-4xl md:text-6xl mt-2">Award season 🏆</h2>
      <ul className="mt-5 space-y-2">
        {wrapped.achievements.map((a, i) => (
          <motion.li key={a} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }}
            className="font-bold text-lg md:text-2xl">★ {a}</motion.li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 9: Community** — `src/slides/Community.tsx`:

```tsx
import { wrapped } from "../data/wrapped";
import { CountUp } from "../story/CountUp";

export function Community() {
  return (
    <div className="text-[#2a1500]">
      <div className="text-sm font-extrabold tracking-[0.2em] opacity-80">COMMUNITY BUILDER</div>
      <div className="font-display font-black text-7xl md:text-9xl mt-2 leading-[0.85]">
        <CountUp to={80} suffix="+" />
      </div>
      <div className="font-display font-extrabold text-2xl mt-1">members, from zero</div>
      <p className="mt-4 text-base font-semibold opacity-80 max-w-md">{wrapped.leadership.line2}</p>
    </div>
  );
}
```

- [ ] **Step 10: Typecheck + commit**: `npx tsc --noEmit && git add -A && git commit -m "feat: add wrapped slides 1-9"`

---

## Task 9: Summary slide + PNG share + CV (`Summary`, `share/saveCard.ts`)

**Files:** `src/slides/Summary.tsx`, `src/share/saveCard.ts`

- [ ] **Step 1: saveCard** — `src/share/saveCard.ts`:

```ts
import { toPng } from "html-to-image";

export async function saveCard(node: HTMLElement, filename = "darshil-wrapped.png"): Promise<boolean> {
  try {
    const url = await toPng(node, { pixelRatio: 2, cacheBust: true });
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Summary** — `src/slides/Summary.tsx`:

```tsx
import { useRef, useState } from "react";
import { wrapped } from "../data/wrapped";
import { saveCard } from "../share/saveCard";

export function Summary() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState("");
  const d = wrapped.driver;

  const onSave = async () => {
    if (!cardRef.current) return;
    const ok = await saveCard(cardRef.current);
    setMsg(ok ? "Saved! Check your downloads." : "Couldn't export — screenshot this card instead.");
  };

  return (
    <div className="text-white w-full">
      <div className="text-sm font-extrabold tracking-[0.2em] opacity-90 mb-3">THAT'S A WRAP ✦</div>
      <div ref={cardRef} className="rounded-2xl p-6 max-w-md" style={{ background: "linear-gradient(160deg,#1db954,#191414)" }}>
        <div className="font-display font-black text-3xl">{d.name}</div>
        <div className="opacity-80 text-sm">{d.years} · WRAPPED</div>
        <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
          <div><div className="opacity-60 text-xs">TOP SKILL</div><div className="font-bold">{wrapped.topSkills[0].name}</div></div>
          <div><div className="opacity-60 text-xs">TOP ARTIST</div><div className="font-bold">{wrapped.artists[0].name}</div></div>
          <div><div className="opacity-60 text-xs">GENRE</div><div className="font-bold">{wrapped.genre.title}</div></div>
          <div><div className="opacity-60 text-xs">CGPA</div><div className="font-bold">{d.cgpa}</div></div>
          <div><div className="opacity-60 text-xs">SCREENED</div><div className="font-bold">{wrapped.stats.resumes}+ resumes</div></div>
          <div><div className="opacity-60 text-xs">BUILT</div><div className="font-bold">80+ community</div></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-5">
        <button onClick={onSave} className="bg-white text-black font-bold rounded-full px-5 py-2.5">↓ SAVE CARD (PNG)</button>
        <a href="/Darshil_Jain_Resume.pdf" download className="border border-white/60 rounded-full px-5 py-2.5 font-bold">GET THE FULL TRACKLIST (CV)</a>
        <a href={wrapped.contact.linkedin} target="_blank" rel="noreferrer" className="border border-white/60 rounded-full px-5 py-2.5 font-bold">LINKEDIN</a>
      </div>
      {msg && <p className="text-sm mt-3 opacity-90">{msg}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + commit**: `npx tsc --noEmit && git add -A && git commit -m "feat: add summary slide with PNG share + CV download"`

---

## Task 10: Ambient audio (`audio/useAmbient.ts`)

**Files:** `src/audio/useAmbient.ts`

- [ ] **Step 1: Implement** — original Web Audio pad, no asset:

```ts
import { useRef, useState } from "react";

export function useAmbient() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const [on, setOn] = useState(false);

  const start = () => {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.04; master.connect(ctx.destination);
    [220, 277.18, 329.63].forEach((f) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = f; gain.gain.value = 0.5;
      osc.connect(gain); gain.connect(master); osc.start();
      nodesRef.current.push({ osc, gain });
    });
    setOn(true);
  };

  const stop = () => {
    nodesRef.current.forEach(({ osc }) => { try { osc.stop(); } catch { /* already stopped */ } });
    nodesRef.current = [];
    ctxRef.current?.close(); ctxRef.current = null;
    setOn(false);
  };

  return { on, toggle: () => (on ? stop() : start()) };
}
```

- [ ] **Step 2: Typecheck + commit**: `npx tsc --noEmit && git add -A && git commit -m "feat: add Web Audio ambient (no asset)"`

---

## Task 11: Assemble `StoryPlayer` + `App`

**Files:** `src/story/StoryPlayer.tsx`, `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: StoryPlayer** — `src/story/StoryPlayer.tsx`:

```tsx
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { slides } from "../data/wrapped";
import { useStoryPlayer } from "../lib/useStoryPlayer";
import { useAmbient } from "../audio/useAmbient";
import { ProgressBars } from "./ProgressBars";
import { Slide } from "./Slide";
import { Intro } from "../slides/Intro";
import { TopSkills } from "../slides/TopSkills";
import { TopArtists } from "../slides/TopArtists";
import { BigStatI } from "../slides/BigStatI";
import { BigStatII } from "../slides/BigStatII";
import { Genre } from "../slides/Genre";
import { TopAlbum } from "../slides/TopAlbum";
import { Platinum } from "../slides/Platinum";
import { Community } from "../slides/Community";
import { Summary } from "../slides/Summary";
import type { SlideId } from "../data/wrapped";

const VIEWS: Record<SlideId, React.ComponentType> = {
  intro: Intro, skills: TopSkills, artists: TopArtists, statResumes: BigStatI,
  statConverge: BigStatII, genre: Genre, album: TopAlbum, platinum: Platinum,
  community: Community, summary: Summary,
};

export function StoryPlayer() {
  const p = useStoryPlayer();
  const audio = useAmbient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); p.goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); p.goPrev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

  const begin = () => { p.start(); if (!audio.on) audio.toggle(); };

  const current = slides[p.index];
  const View = VIEWS[current.id];

  return (
    <div className="fixed inset-0 select-none">
      <ProgressBars index={p.index} elapsedPct={p.elapsedPct} />

      <AnimatePresence mode="wait">
        <Slide key={current.id} gradient={current.gradient}>
          <View />
        </Slide>
      </AnimatePresence>

      {/* tap zones */}
      <button aria-label="previous" className="absolute left-0 top-0 h-full w-1/3 z-20"
        onClick={p.goPrev}
        onPointerDown={() => p.setPaused(true)} onPointerUp={() => p.setPaused(false)} />
      <button aria-label="next" className="absolute right-0 top-0 h-full w-1/3 z-20"
        onClick={p.goNext}
        onPointerDown={() => p.setPaused(true)} onPointerUp={() => p.setPaused(false)} />

      {/* controls */}
      <div className="absolute top-4 right-4 z-30 flex gap-2 text-xs">
        <button onClick={audio.toggle} className="rounded-full bg-black/30 text-white px-3 py-1.5 backdrop-blur">
          {audio.on ? "♪ ON" : "♪ OFF"}
        </button>
      </div>

      {/* start gate */}
      {!p.started && (
        <button onClick={begin}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-sm text-white">
          <span className="font-display font-black text-3xl md:text-5xl animate-pulse">▸ TAP TO BEGIN</span>
        </button>
      )}

      {/* hint */}
      <div className="absolute bottom-4 left-0 right-0 z-30 text-center text-white/70 text-xs">
        ← → or tap sides · hold to pause
      </div>
    </div>
  );
}
```

- [ ] **Step 2: App** — replace `src/App.tsx`:

```tsx
import { StoryPlayer } from "./story/StoryPlayer";
export default function App() { return <StoryPlayer />; }
```

- [ ] **Step 3: main.tsx** — ensure it imports `./index.css` and renders `<App />` (Vite default). No Router needed.

- [ ] **Step 4: Run full suite + build + dev check**

Run `npm test && npm run build`. Then `npm run dev` and verify: tap to begin → slides auto-advance with progress bars → ← / → and side taps work → hold pauses → confetti on Platinum → Summary saves a PNG and CV downloads → sound toggle works. Stop server.

- [ ] **Step 5: Commit**: `git add -A && git commit -m "feat: assemble StoryPlayer + app"`

---

## Task 12: Optional AI backdrops (gpt-image-bridge) with CSS fallback

**Files:** `public/bg/*.png`, edits to `data/wrapped.ts` (+`bg` field) and `Slide` usage.

- [ ] **Step 1:** Using the `gpt-image-bridge` skill, generate 3–4 abstract, grainy, duotone gradient textures (no text, no logos) sized ~1080×1920, e.g. `public/bg/skills.png`, `public/bg/album.png`, `public/bg/summary.png`. If the bridge is unavailable, SKIP this task — the CSS gradients already look complete.
- [ ] **Step 2:** Add an optional `bg?: string` to chosen `SlideDef`s and pass `slides[index].bg` into `<Slide bg={...}>` (already supported by the Slide component). Missing/failed images fall back to the gradient (the `<img>` simply doesn't render meaningfully).
- [ ] **Step 3:** `npm run build` + visual check; commit `git add -A && git commit -m "feat: optional AI backdrops with CSS fallback"`. (If skipped, note it in the commit/PR.)

---

## Task 13: Final QA — Lighthouse, a11y, responsive, reduced-motion

- [ ] **Step 1:** `npm run build && npm run preview`.
- [ ] **Step 2:** Lighthouse (Perf ≥ 90, A11y ≥ 90). Verify confetti/motion are not janky.
- [ ] **Step 3:** Responsive at 390 / 768 / 1440 — slides fill the screen, type scales, no overflow, tap zones reachable.
- [ ] **Step 4:** Toggle OS Reduce Motion: no auto-advance, no count-up animation (targets shown), no confetti; manual nav still works.
- [ ] **Step 5:** Fix issues; `git commit -am "fix: wrapped QA — a11y, responsive, reduced-motion"`

---

## Task 14: Deploy to GitHub + Vercel

- [ ] **Step 1:** `gh repo create darshil-wrapped --public --source=. --remote=origin --push`
- [ ] **Step 2:** `npx vercel --prod` (Vite auto-detected). Requires GitHub + Vercel auth.
- [ ] **Step 3:** Smoke-test the live URL (begin → all slides → save card → CV). 
- [ ] **Step 4:** Add live URL to `README.md`; `git add -A && git commit -m "docs: add live URL" && git push`

---

## Self-Review (completed by plan author)

- **Spec coverage:** story format + controls → Tasks 5,11; full energy (confetti/count-up/emoji) → Tasks 6,7,8; all 10 slides → Tasks 8,9; share PNG → Task 9; résumé PDF → Tasks 1,9; sound toggle → Tasks 10,11; AI backdrops + fallback → Tasks 7(bg support),12; data single-source → Task 2; reduced-motion → Tasks 4,5,6,7,13; deploy → Task 14. All spec sections mapped.
- **Placeholder scan:** none — every code step is complete and runnable.
- **Type consistency:** `SlideId`/`SlideDef`/`slides` (Task 2) consumed by `player`/`useStoryPlayer` (Tasks 3,5), `ProgressBars` (Task 7), and `StoryPlayer` VIEWS map (Task 11). `wrapped` shape (Task 2) consumed by all slides (Tasks 8,9). `saveCard(node)` (Task 9) called by Summary. `useAmbient().toggle` (Task 10) used by StoryPlayer.
```
