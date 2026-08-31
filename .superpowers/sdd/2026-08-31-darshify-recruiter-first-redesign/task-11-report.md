# Task 11 report — recruiter-friendly portfolio discovery

## Scope delivered

- Added a visible, programmatically named `SearchField` with a concise hint, native search semantics, a clear action, no autofocus, and no query persistence.
- Extended the module-initialized search corpus to normalize diacritics and prepare title, organization, role, period, kind, recruiter takeaway, situation, actions, result, skills, proof labels/summaries/periods, artifact provenance, and source title/kind/note once. Each query remains a deterministic O(n) scan of prepared strings; direct content lookups continue to use the existing O(1) maps.
- Added `SearchResults` grouped into Experience, Projects, Leadership, Achievements, and Skills. Every case result links to its stable `/case-studies/:slug` route; skill matches link to the stable Skills collection.
- Replaced recent-search and generic Evidence result framing. Search now has a clear empty state and professional category recovery without saved/search-history semantics.
- Rebuilt Library as **Career Library**. Professional categories are primary, Spotify-style release names are secondary, category filters are native buttons with `aria-pressed`, the search field is visibly labelled, and the explicit native sort control performs A–Z ordering in O(n log n).
- Removed the candidate-owned/saved/recency fiction from Library. It contains only canonical collections and existing truthful descriptions/artwork.
- Updated Search and Library metadata plus the independent prerender/hydration regression contracts. Added all new and changed runtime modules to the binding cumulative coverage inventory.

## TDD evidence

- RED: `npm test -- src/pages/Search.test.tsx src/pages/Library.test.tsx src/content/selectors.test.ts` — 9 expected failures / 12 passes. Failures captured missing source-provenance indexing, absent professional result grouping, raw query persistence, old Library naming/filtering/recency behavior, and missing explicit A–Z semantics.
- GREEN: the focused suite now passes 23/23 tests, including organization, skill, situation, action, result, recruiter-takeaway, and source searches; stable routes; empty state; no autofocus; no persistence; keyboard-operable category filtering; and A–Z ordering.

## Search benchmark

- The benchmark performs exactly 1,000 searches over the current canonical corpus in 20 batches of 50, then evaluates the median per-search batch cost. Batching avoids relying on sub-millisecond timer resolution while retaining the local environment guardrail.
- Fresh measured median: **0.0063ms per search**, below the task's local `<50ms` assertion.
- This is an environment-specific regression guard, not a cross-device performance promise.

## Persistence audit

- Production Search, SearchField, SearchResults, selector, and route files contain no `localStorage`, `sessionStorage`, `useLocalStorage`, or `dx_recents` access.
- Production-browser verification entered `confidential recruiter query`, submitted it, then confirmed the term and `dx_recents` were absent from browser storage.
- The prerender hydration test deliberately seeds the retired `dx_recents` key to prove it is ignored; it no longer surfaces recent-search UI or alters hydration.

## Fresh verification

- `npm run check` — exit 0.
  - Format, lint, type-check, aggregate coverage, and production build passed.
  - 28 test files / 203 tests passed.
  - Coverage: 94.79% statements, 90.80% branches, 95.40% functions, 95.88% lines.
  - Search and Library route modules are directly exercised through their default exports and metadata; the new runtime files are in the binding redesign scope.
  - Production build prerendered all 28 HTML routes.
- Full `npm run test:e2e` — 22/22 production-browser tests passed.
- Final focused `npm run test:e2e -- e2e/discovery.spec.ts` — 3/3 passed after the last mobile copy refinement.
  - Exact 390×844 viewport verifies no mobile search autofocus, grouped stable routes, keyboard filtering and sorting, and no raw query persistence.
- Exact 390×844 Playwright screenshots of Search and Career Library were visually inspected. Labels, headings, controls, wrapping, filters, and bottom navigation remain readable and contained; the search placeholder was shortened after inspection.

## Truth and concerns

- No evidence was invented. Search indexes only canonical portfolio, proof, artifact, and source fields; result copy and routes derive from the typed model.
- Search currently maps canonical education/certification cases into the approved Achievements result group because the five required result headings do not include a separate credentials group. Career Library retains distinct Certifications and Education categories, so those professional labels remain available during category browsing.
- No blocking concerns. React Router future-flag notices remain pre-existing and non-blocking.

## Fix Round 1 — precise categories and concise announcements

- Replaced prose-inferred category matching with a module-initialized canonical category index. Experience, Projects, Achievements, Education, Certifications, and Skills derive from collection membership; Leadership derives from the canonical leadership kind because no standalone leadership collection exists.
- Exact category aliases now scope the existing O(n) corpus scan to canonical case IDs. Independent positive/negative contracts cover experience, projects, leadership, achievements, education, certifications, and skills, preventing unrelated cases from leaking into category searches.
- Shared résumé artifact title/alt/provenance is excluded from each case's free-text corpus when the artifact is referenced by multiple cases. Item-specific artifact evidence remains searchable, and canonical source title/kind/note plus item-specific proof/case text remain indexed.
- Added an O(1) professional-category identity map for rendering. Education and Certifications now have truthful standalone result headings and never render under Achievements. Skills remains a cross-cutting group with the stable `/playlist/skills` route.
- Moved `role="status"`, `aria-live="polite"`, and `aria-atomic="true"` onto only the concise result-count or no-results message. Result sections, lists, articles, and links are outside every live region, avoiding full-tree screen-reader re-announcements.

### Fix Round 1 TDD evidence

- RED: focused selector/Search run — 10 expected failures / 18 passes exposed all-category leakage from the shared résumé artifact, education/certification grouping under Achievements, and the results tree inside a live region.
- GREEN: focused selector/Search run — 28/28 passed, including exact canonical category inventories, item/source matching, truthful group isolation, concise live status, stable routes, empty state, and no persistence.

### Fix Round 1 fresh verification

- `npm run check` — exit 0.
  - 28 test files / 213 tests passed.
  - Coverage: 94.81% statements, 90.58% branches, 95.18% functions, 95.86% lines.
  - The binding coverage-inventory regression passed with Search, Library, route, selector, and component runtime still included.
  - Format, lint, type-check, production build, and all 28 prerendered routes passed.
- Full `npm run test:e2e` — 23/23 production-browser tests passed.
  - Mobile no-autofocus, category/group isolation, concise live-region boundary, keyboard Library filtering/sorting, raw-query persistence audit, route stability, prerender, hydration, and all existing recruiter journeys passed.
- Fresh 1,000-search benchmark median: **0.0056ms per search** in this environment, below the local `<50ms` guardrail. The batched median structure remains a regression guard, not a cross-device promise.
- Production Search runtime remains free of `localStorage`, `sessionStorage`, `useLocalStorage`, and `dx_recents` access.
- No blocking concerns. Exact category aliases intentionally prefer canonical category identity over coincidental prose matches; non-category queries continue matching prepared organization, skill, action, result, takeaway, proof, artifact, and source evidence.
