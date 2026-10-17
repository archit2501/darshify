# Research synthesis: Spotify immersion + name SEO (sector v3)

**Date:** 2026-10-17 · **Scope:** Large · **Branch:** `feature/spotify-immersion` (from `build/darshify` at `3dfae91`)
**Inputs:** [`01-codebase.md`](./01-codebase.md), [`02-market-tech.md`](./02-market-tech.md), [`03-uiux.md`](./03-uiux.md). The previous (recruiter-first) synthesis is in git at `60fd7a2`.

**Owner brief:** visitors should feel they are inside the Spotify app and be "mesmerized" on every page, as if a master UI/UX engineer built it. Searches for "Darshil Jain" / "Darshil" should surface Darshil first on Google, other engines and AI assistants (SEO + AEO + GEO).

---

## Top 5 cross-cutting insights

1. **The foundation is right; the presentation layer is wrong.** All three agents agree.
   - **Keep:** SSR + prerender of all 28 routes, a typed content model with sources, a11y plumbing (skip link, landmarks, route focus, reduced motion), and green, fast quality gates (lint 4 s, 296 tests 10 s, build 2 s).
   - **What fails:** what the visitor sees reads as "a dark compliance report wearing a Spotify sidebar":
     - monospace "self-reported" labels (10× on one page) and "The résumé reports…" in every result;
     - identical black/green text covers;
     - 222 px bordered card "tracks";
     - no persistent player, and the one that appears has an invisible white-on-white play button (`CareerMixDock.tsx:19-20,97`, confirmed).
   - **The plan:** rebuild the presentation layer on the existing content/SEO spine. Don't rewrite the app.
2. **Most of the Spotify experience already existed and was deliberately deleted.**
   - **Deleted:** player bar, scrubber, volume, shuffle/repeat, queue, Now Playing panel, mobile full-screen sheet, track table with play-swap, context menu, card hover play, keyboard shortcuts, recent searches.
   - **Restore sources:** `a154bd1^` and `fd6de35^`, which are already Motion 13–migrated.
   - **Why it went:** it was paired with **fabricated data** (98,400 "monthly listeners", "Verified Candidate", invented play counts), a 60 fps re-render loop and a11y bugs. Restore the _behavior_ with honest data and a better store; don't restore the fake numbers.
3. **"Honest fidelity" resolves fidelity against truth.** Every Spotify slot can hold a true fact:
   - plays column → impact ("500+ résumés screened");
   - duration → engagement length ("2 mo");
   - date added → start month;
   - listener line → "3 internships · 4 projects · 4 awards";
   - lyrics → the case study's Situation → Actions → Result lines;
   - Credits → the single "Source: résumé" row that replaces every "self-reported" chip.

   The immersion comes from the _behavior_: a real player that drives the whole UI, artwork color bleeding into headers, 56 px track tables, the hover play rise, shortcuts and a lyrics mode. Fake numbers aren't needed for it.

4. **Name SEO is a disambiguation problem, not a markup problem.**
   - **The competition:** at least six other "Darshil Jain"s rank on LinkedIn and ZoomInfo, and this site isn't indexed in the tested index.
   - **The levers, in order:**
     1. a domain with Darshil's name (`darshiljain.com` looked unregistered on 17 Oct);
     2. an entity graph on `/` (`WebSite` + `ProfilePage` + `Person` with `alternateName`, `alumniOf` MSI/GGSIPU, Delhi, founder of Igniters Club, `sameAs`);
     3. disambiguators in every title and description;
     4. an answer-first "Who is Darshil Jain?" block with quotable numbers;
     5. a **real photo**;
     6. Search Console + Bing Webmaster + IndexNow;
     7. explicit AI-crawler allow rules.
   - **What doesn't work:** `llms.txt` and FAQ rich results are not levers in 2026, and keyword stuffing hurts.
   - **Expectation:** ranking #1 for the bare first name "Darshil" is a stretch goal. "Darshil Jain" + qualifiers, and AI answers, are winnable.
5. **The app-like UI must stay crawlable and fast.** Every competitor Spotify portfolio fails here: Joshify and Franco serve empty shells, and Luan gates its content behind a loader. Rules for this redesign:
   - panels are _views_ of SSR content, so collapsed ≠ unmounted;
   - every destination is a real `<a href>`, and search state lives in `?q=`;
   - colour is precomputed at build time;
   - initial JS ≤ 170 KB gzip, with the player and immersive mode lazy-loaded where possible;
   - fix the two existing perf traps: the shell re-renders on every scroll event, and the Career Mix context re-renders every consumer 4×/s.

## Conflicts between findings (surface in Phase 2, never resolve silently)

| #   | Conflict                                                                                                                                                                                         | Proposed resolution                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Truthful vs. Spotify slots.** The previous decisions plus `content.test.ts:76` ban plays, durations, listeners and verified badges. The owner wants it to feel like real Spotify.              | **Honest fidelity:** every slot gets a true value; omit a slot rather than fake it.                                                                                                                                                                                    |
| C2  | **Recruiter-first vs. immersion.** The previous synthesis said "Spotify is grammar, not IA" and put a "Recruiter briefing" card on Home. The UI agent recommends full Spotify IA.                | Full Spotify IA, with **CV / Email / LinkedIn one click away everywhere**: the artist action bar, the avatar menu and the player download icon. The answer-first facts stay in SSR HTML.                                                                               |
| C3  | **Career Mix scope.** The previous decision was a silent 60 s, 3-chapter tour that drops queue/shuffle/repeat. Now: a full real transport.                                                       | The full transport, all of it real: play this list, seek, shuffle, repeat, queue, Now Playing, lyrics. Volume is shown only if real audio exists.                                                                                                                      |
| C4  | **Library choices.** The previous decision was "original icons, no Lucide, Motion only". Agent 2 suggests Base UI (menus, drawer, tooltip, slider) + react-resizable-panels (+ optional Lucide). | Keep the original icon set (extended) and Motion as the only animation runtime. Add **Base UI** for menus/drawer/tooltip. **Hand-roll the resizer** with fixed px widths, which is SSR-safe with no CLS, instead of react-resizable-panels. Build-time `sharp` colour. |
| C5  | **Typography.** Archivo + IBM Plex Mono (the previous "editorial" voice) vs. Figtree (the closest free Spotify Mix/Circular feel, 20 KB).                                                        | Figtree only, and drop the mono entirely. Verify tabular figures before relying on them.                                                                                                                                                                               |
| C6  | **Signature element.** The previous "Proof Waveform" vs. the UI agent saying "it reads as a broken sparkline; retire it".                                                                        | Retire it. The new signature is **lyrics-mode case studies + an opt-in "Rewind" story**.                                                                                                                                                                               |
| C7  | **Fidelity vs. IP.** The owner wants "near-indistinguishable", but Spotify's guidelines forbid look-alike logos, wordmarks and fonts. Agent 2 notes "Darshify" sounds like Spotify.              | Clone the layout, behavior, density, tokens and shortcuts. Keep the logo, font, icons and name original. Add a non-affiliation line. Keep the test that blocks a Spotify-logo facsimile. Lead SEO with the _name_, not "Darshify".                                     |
| C8  | **Domain.** SEO wants Darshil's name in the domain. Everything is hard-coded to `wrapped-portfolio.vercel.app` (meta, robots, sitemap, tests, analytics).                                        | Make the origin a single config value. Ship on the current host now, and switch it with one line + a 308 redirect when the owner registers the domain.                                                                                                                 |
| C9  | **Search state.** The new design uses URL `?q=` and recent searches; `e2e/discovery.spec.ts:94` forbids persisting queries.                                                                      | Put the query in the URL (`noindex,follow` on query pages, canonical `/search`). Recent searches are optional and use localStorage with try/catch.                                                                                                                     |
| C10 | **Duplicate routes.** `/liked` and `/playlist/achievements` are both indexed.                                                                                                                    | Make `/liked` canonical ("Liked Songs"-styled Awards) and 301 the other.                                                                                                                                                                                               |
| C11 | **Protocol vs. repo.** The protocol says "merge to main", but the repo's default branch is `build/darshify`. CI runs PR checks only for `main`.                                                  | PRs target `build/darshify`. Fix the CI trigger in the first task.                                                                                                                                                                                                     |

## Blocking assets (owner input)

1. **A real photo of Darshil**: a square portrait ≥1200 px, ideally plus a wide banner ≥2400×900. It unblocks the artist header, the About card, Now Playing "About the artist", Person/ProfilePage `image` and image search. None exists anywhere.
2. **Other public profiles** for `sameAs` (Unstop, Instagram, X, GitHub), if they are professional.
3. **Availability / target roles wording.** Without it, drop that section.
4. Optional: a 60–90 s voice intro with a transcript, which would enable real audio and a volume control.
5. Optional, outside the repo: register `darshiljain.com`, set a custom LinkedIn URL, fix the résumé PDF metadata (Title "Copy of Resume", Author "Harish jaiswal") and point the résumé's "Portfolio" link to the site.

## Hard constraints carried into planning

- The 90 % aggregate coverage gate is over an explicit allowlist (`vite.config.ts:29-65`). Branch headroom is about 6 branches, so every new runtime file must be added and covered.
- About 15 tests encode the recruiter-first stance and must be rewritten deliberately. The Spotify-logo facsimile guard stays.
- 28 hard-coded route and social-card counts; social cards must be regenerated whenever titles or routes change.
- The prerendered HTML must keep main content, H1s and links (e2e "core content without JavaScript" checks).

## Learnings during delivery

- **4.1.2: the contact answer leaked the email.** The FAQ's "How do I contact Darshil Jain?" printed the address into FAQPage JSON-LD and `llms.txt`. It now points to the Email and LinkedIn buttons, and tests keep the email and phone out of every machine-readable file.
- **4.2.1: Base UI and Motion sat on every page's critical path.** Base UI with floating-ui was ~62 KB gzipped, Motion ~25 KB, and initial JS was ~250 KB against a 170 KB budget. Menus, dialogs, the phone player's drawer and tooltips now load on first use behind plain server-rendered buttons, which keeps the prerendered HTML unchanged. Initial JS is now ~150 KB.
- **4.2.1: this supersedes C4's "Motion as the only animation runtime".** Motion's one use (the proof waveform's draw-on) is CSS now, so CSS is the only animation runtime.
- **4.2.1: Tailwind 4 scanned the whole repository.** Plans, research and old docs added ~1.4 KB gzipped of unused CSS. Sources are now limited to `src/` and `app/`.
- **4.2.1: `new AudioContext()` can block for ~200 ms.** This is browser audio-device setup. The engine is now built in idle time after the visitor's first click or key press, so Play only resumes it.
- **4.2.1: axe can't measure text over gradients.** The colour rules are unit-tested across every song, release, genre and Rewind colour (`src/content/contrast.test.ts`). Two Rewind colours were deepened slightly. Text on player surfaces is ≥80% white over the song colour 20% darker.
- **4.2.1: phones need `scroll-padding` under fixed chrome.** Without it, keyboard focus slid under the mini player and tab bar (WCAG 2.4.11).
- **4.2.1: Figtree's Latin subset has no rupee sign.** A 1 KB glyph subset replaces the 10 KB latin-ext file.
- **4.2.1: the server function crashed on Vercel.** Every server-rendered request (unknown URLs, bad slugs) answered 500 `FUNCTION_INVOCATION_FAILED`. The cause: `react-router-dom` pulls in `react-router/dom`, a file Vercel's file tracing leaves out of the function. Production, built in August, was unaffected, but any rebuild would have broken it. Imports now come from `react-router` only, and ESLint plus a check on the server bundle guard it. Lesson: validate the deployed preview, not just the local server.
- **4.3.1: Vercel's preview toolbar stalls `networkidle`.** It is injected only into preview deployments, and its requests (a login check, a `HEAD` for the current page) kept a 17-page walk from ever going idle. Deployment test runs send `x-vercel-skip-toolbar: 1`. Production has no toolbar.
- **4.3.1: shipped.** The integration branch merged into `build/darshify` with a merge commit, after the full browser suite passed against the deployed head. The rollback point is `3dfae91`.
