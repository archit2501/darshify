# Darshify Recruiter-First Spotify-Themed Redesign

**Date:** 2026-08-31  
**Status:** Approved design; pending implementation plan  
**Owner:** Archit Jain, building for Darshil Jain  
**Scope:** Large redesign  
**Research:** `research/00-synthesis.md`, `research/01-codebase.md`, `research/02-market-tech.md`, `research/03-uiux.md`, `DESIGN-IS-2026-08-29/`

## Summary

Darshify will remain a Spotify-themed portfolio, but it will stop behaving like a simulated music player. Career evidence becomes the domain model; the streaming-product language becomes the presentation layer. The canonical experience is an artist profile that establishes Darshil's target role and value, exposes sourced proof, leads into evidence-rich “tracks,” and keeps CV, email, and LinkedIn conversion paths visible.

The redesign evolves the current React application rather than replacing it. It introduces typed evidence content, statically prerendered routes, artifact-led artwork, a candidate-specific Proof Waveform, and a truthful silent Career Mix. Fabricated listeners, plays, durations, verification labels, rankings, and dead social controls are removed.

## Goals

- Keep Darshify unmistakably Spotify-themed through its dark streaming shell, artist framing, release shelves, track rows, search, library, play affordance, and green signal color.
- Let a recruiter identify Darshil's target function, value proposition, and at least one verified proof point within five seconds.
- Keep CV, email, LinkedIn, and Career Mix actions visible in the first Home viewport on desktop and mobile.
- Turn projects and work experience into stable, shareable case studies structured as Situation → Action → Result → Evidence.
- Make every quantitative claim traceable to source, period, and verification status.
- Give Darshify a candidate-specific visual identity through the Proof Waveform and real or visibly redacted artifacts.
- Meet WCAG 2.2 AA, strict performance budgets, and a 90% new/modified-code coverage target.
- Preserve existing public URLs while adding stable case-study URLs and statically prerendered metadata.

## Non-Goals

- No CMS, backend, account system, social graph, or external Spotify integration.
- No recorded narration in v1.
- No fake music playback, ambient tone, listener count, play count, track duration, follow behavior, shuffle, repeat, likes, or decorative queue.
- No generic AI artwork, fabricated screenshots, unlabelled confidential data, or trademarked Spotify logo/assets.
- No fuzzy-search or indexing dependency at the current content scale.
- No second animation runtime and no replacement icon library.

## Product Concept

### Chosen information architecture

The chosen direction is **Artist Profile → Proof Tracks → Conversion**.

Two alternatives were rejected:

- **Album Casebook** creates a strong editorial artifact but weakens immediate personal positioning.
- **Career Wrapped** is shareable but risks presentation theatre, motion overload, and recruiter inefficiency.

The selected direction preserves the strongest Spotify grammar while improving recruiter comprehension.

### Core sequence

1. **Recruiter briefing hero:** Darshil's name, target role, concise value proposition, one sourced proof point, portrait/artwork, and CV, Email, LinkedIn, and Play actions.
2. **Popular / Selected Impact:** three priority proof tracks ranked by recruiter value, with no simulated popularity metadata.
3. **Proof Waveform:** an evidence-backed visual index that connects outcomes to sources and case studies.
4. **Career Releases:** projects, experience, leadership, skills, education, awards, and certifications organized through Spotify-style shelves, releases, and track rows.
5. **Conversion ending:** availability, contact actions, résumé, and a concise reason to begin a conversation.

### Home

Home is the primary recruiter landing page, not a generic browse feed. Its first viewport must include:

- Darshil Jain.
- Target role/function.
- One-sentence professional proposition.
- At least one sourced proof point.
- CV, Email, LinkedIn, and Start Career Mix controls.
- Candidate artwork and a compact Proof Waveform without crowding out the content above.

Below the first viewport, Home presents three Recruiter Essentials, then evidence-led release shelves. Time-based greetings may remain only if they do not displace identity or proof.

### Artist profile

The Artist page becomes the canonical candidate profile. It provides the complete proposition, proof summary, selected impact, releases, About narrative, education, skills, availability, and contact actions. It must never display “Verified Candidate” unless an actual named verifier and source exist.

### Case studies

Each priority project and role receives a stable route and contains:

- Title, category, organization/client, role, and period.
- Recruiter takeaway.
- Situation.
- Darshil's specific actions and contribution.
- Result, including the measurement period and scope.
- Evidence/source links and verification status.
- Real or visibly redacted artifacts where available.
- Related proof tracks and contact/CV actions.

The content must distinguish personal contribution from team output and facts from estimates.

### Search and Library

Search and Library remain because they are useful Spotify-native exploration patterns. Primary labels use plain professional language; themed labels are secondary. Search matches normalized titles, organizations, categories, skills, actions, results, and recruiter takeaways. Library groups releases and lets recruiters filter by evidence category without introducing fake ownership or saved-state semantics.

### Career Mix

The global Play action launches a truthful, silent, 60-second guided recruiter tour. It contains a small curated sequence of proof chapters and exposes:

- Start, play/pause, previous, next, and close.
- Visible elapsed and total progress.
- Chapter title, concise takeaway, and supporting proof/source.
- Deep link to the full case study.
- Keyboard-operable controls and announced state changes.

It does not autoplay, emit audio, fake a track duration, or use shuffle/repeat. Ordinary cards say “Read case study” or “View proof”; “Play” is reserved for the Career Mix.

## Truth and Evidence Model

Typed static content is the only source of portfolio truth. Spotify-style tracks, releases, shelves, search results, and curated rankings are derived presentation views.

The model must represent these concepts:

- `CandidateProfile`: identity, role targets, proposition, location/availability, contacts, résumé, and profile artwork.
- `ProofPoint`: claim, value/unit, source label, source URL or artifact reference, period, verification status, and related case-study IDs.
- `CaseStudy`: stable ID/slug, category, organization, role, dates, situation, actions, result, recruiter takeaway, proof IDs, artifact IDs, skills, and related case-study IDs.
- `Artifact`: real asset or fact-led typographic cover, alt text, caption, crop variants, redaction status, and source/provenance.
- `Collection`: title, professional category, themed release label, description, and ordered case-study/proof references.
- `CareerMixChapter`: case-study/proof reference, duration allocation, takeaway, and deep link.

Required validation:

- All IDs and slugs are unique.
- Every reference resolves.
- Every quantitative claim has source, period, and verification status.
- Every artifact has meaningful alternative text and provenance.
- Confidential artifacts are visibly redacted and labelled.
- Every primary route has title, description, canonical URL, and social metadata.
- Invalid content fails the test/build pipeline before deployment.

## Visual System

### Color

| Token      |     Value | Purpose                                           |
| ---------- | --------: | ------------------------------------------------- |
| `ink`      | `#000000` | App canvas only                                   |
| `panel`    | `#121212` | Main surfaces                                     |
| `elevated` | `#1B1B1B` | Cards and drawers                                 |
| `line`     | `#303030` | Dividers and focus offsets                        |
| `text`     | `#F7F7F5` | Primary text                                      |
| `muted`    | `#B3B3B3` | Secondary text                                    |
| `signal`   | `#1ED760` | Primary actions, current state, and proof markers |

Black and green preserve brand memory. At most four accessible secondary signals may differentiate categories, and only in chips, thin edges, or waveform segments. Full-card rainbow gradients are removed.

### Typography

- Archivo Variable, licensed under an appropriate open license, provides display, UI, and body text.
- IBM Plex Mono is used sparingly for dates, KPI values, sources, and Proof Waveform annotations.
- Scale: 12 utility, 14 metadata, 16 body, 20 card title, 28 section title, and 40/56 mobile/desktop hero.
- The candidate name must not push proof or conversion controls below the first viewport.
- Body line-height is approximately 1.55 and long-form evidence columns are limited to 65–72 characters.
- Metrics use tabular numerals.

### Layout

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, and 64px.
- Desktop content width: 1200–1280px; evidence reading width: 680–760px.
- Desktop navigation rail: 216–232px and only for unique navigation.
- Mobile gutters: 16px.
- Minimum interactive target: 44×44px.
- Mobile cards may horizontally snap while leaving a visible next-card edge; no essential content depends on horizontal scrolling.

### Artwork

- Priority project/experience covers use real or visibly redacted artifacts: dashboards, trackers, slides, market maps, rubrics, or certificates.
- Where an artifact cannot be shown, use a fact-led typographic cover with a source label.
- One dominant artifact, one proof value, and one category signal per composition.
- Produce intentional 1:1, 16:9, and compact 48px-row crops.
- Prefer responsive AVIF/WebP sources with fallback; use SVG for the Proof Waveform.
- Do not use generic brains, trophies, gears, chess pieces, synthetic 3D blobs, or fabricated UI captures.

### Proof Waveform

The Proof Waveform is Darshify's candidate-specific signature. Its peaks map to verified outcomes, source-backed work scale, or dated career events. Each interactive peak must expose a label and connect to its evidence; it is not a random audio visualization.

The waveform may animate once when resolving from overview to evidence. Its final state remains understandable without animation, and reduced-motion users receive that final state immediately.

## Motion and Interaction

- Migrate from `framer-motion` 12 to Motion 13 using `motion/react` and `LazyMotion`.
- Keep Darshify's original inline SVG icon system; do not add Lucide or another icon library.
- Hover/focus transitions run 120–180ms; drawers and page transitions run 200–260ms.
- Animate transform and opacity only; never use `transition: all`.
- The initial screen is still: no idle pulse, autoplay, parallax, or decorative continuous motion.
- `prefers-reduced-motion: reduce` disables waveform drawing, smooth scrolling, parallax, and toast motion while preserving content and final state.
- Hover never reveals the only route to an action.

## Technical Architecture

### Routing and rendering

- Migrate to React Router 7 Framework Mode with static prerendering.
- Preserve `/`, `/search`, `/library`, `/playlist/:id`, `/artist`, and `/liked` through compatible routes or redirects.
- Add stable case-study routes for priority projects and roles.
- Preserve instant client navigation after initial render.
- Unknown or removed slugs render a designed 404 with recovery links.

### State boundaries

- Portfolio content and navigation are URL/static-data driven.
- Career Mix uses a focused reducer for chapter, play/pause, progress, and completion.
- No whole-application requestAnimationFrame state updates.
- Search and filtering operate over prenormalized strings in O(n); direct item lookup uses O(1) maps; explicit sorting may use O(n log n).
- Main-thread interaction work must remain below 50ms for the current corpus.

### SEO and analytics

- Every prerendered route includes a unique title, description, canonical URL, and social card metadata.
- Add appropriate `Person` and `CreativeWork` structured data without unsupported claims.
- Measure only meaningful outcomes: CV download, email, LinkedIn, case-study open, evidence/source open, and Career Mix completion.
- Analytics must be privacy-conscious and must not block rendering.

## Responsive and Accessibility Requirements

- Meet WCAG 2.2 AA.
- Use links for navigation and buttons for actions; no clickable `div` elements or nested interactive controls.
- Provide “Skip to main content,” named navigation landmarks, hierarchical headings, and designed route focus.
- Maintain visible, high-contrast `:focus-visible` states.
- Keep CV, Email, LinkedIn, proof, and Career Mix in the first viewport at 390×844 and 1440×900.
- Retain mobile bottom navigation, but show the Career Mix tray only while the tour is active.
- Verify behavior at 320px width, common mobile/tablet/desktop widths, 200% text zoom, and 400% browser zoom.
- Inputs require visible labels, names, appropriate autocomplete, and clear error/focus states; mobile search does not autofocus.
- Provide meaningful alt text for evidence images and concise accessible names for controls.
- Automated Axe checks are supplemented by manual keyboard, screen-reader, zoom, contrast, touch-target, and reduced-motion verification.

## Performance Budgets

- Cold first-view transferred payload: no more than 1.0MiB.
- Cold first-view images: no more than 700KiB.
- Initial JavaScript: no more than 150KiB gzip.
- Mobile p75 LCP no more than 2.5s, INP no more than 200ms, and CLS no more than 0.1.
- Lighthouse mobile target: at least 95 in Performance, Accessibility, Best Practices, and SEO.
- Below-fold media and route code are lazy-loaded.
- All images declare dimensions or aspect ratios to prevent layout shift.

## Quality Gates

- Lint: zero errors and zero warnings in new or modified code.
- Type-check: zero errors.
- Format check: all new and modified files formatted.
- Unit/integration tests: all pass with at least 90% coverage on new and modified code.
- Browser tests cover the recruiter journey, Career Mix, stable routes, contact actions, responsive behavior, and 404 recovery.
- Automated Axe scans report zero serious or critical violations; all manual WCAG checks pass.
- Production build and prerender complete successfully.
- Content validation reports zero unresolved references, unsupported quantitative claims, or missing metadata.
- Link checking reports zero broken internal, résumé, contact, evidence, or social links.
- Console checks report zero uncaught errors or hydration warnings.
- Performance budgets pass before release.

## Release Strategy

The full redesign is deployed to a private preview and audited across desktop, mobile, keyboard, screen reader, metadata, analytics, and performance budgets. Production changes in one atomic cutover only after all quality gates pass. The previous production deployment remains the rollback point.

## Success Criteria

- At least 80% of five or more target-role reviewers can state Darshil's target function and one verified proof point after five seconds.
- At least 80% can locate a relevant project, CV, and contact method within 30 seconds.
- CV and contact actions are reachable in one interaction from every primary route.
- Zero fabricated authority, popularity, playback, duration, or verification signals remain.
- 100% of quantitative claims include source, period, and verification metadata.
- 100% of priority project/experience art is real/redacted evidence or fact-led typography.
- All accessibility, testing, performance, and release gates in this specification pass.

## Locked Decisions

- Complete recruiter-first v1 with static typed content; no CMS or recorded narration.
- Spotify theme remains non-negotiable.
- React Router 7 Framework Mode and static prerendering.
- Motion 13 with `LazyMotion`; original Darshify icons.
- Artist Profile → Proof Tracks → Conversion information architecture.
- Truth/conversion, proof-driven identity, and accessibility/mobile are front-loaded.
- At least 90% new/modified-code coverage.
- Private preview followed by one atomic cutover.
- Strict lightweight complexity and sub-50ms interaction contract.
- WCAG 2.2 AA.
- Silent 60-second guided Career Mix.
