# Darshify

Darshify is the personal portfolio of **Darshil Jain**, a BBA (Business & Industry) student at Maharaja Surajmal Institute (GGSIPU), New Delhi, working across operations, strategy and people. It presents Darshil's career the way a music-streaming app presents an artist:

| On the site  | In Darshil's career                                         |
| ------------ | ----------------------------------------------------------- |
| Artist page  | Darshil                                                     |
| EPs / albums | Experience, projects, leadership, credentials and education |
| Songs        | Individual roles and projects                               |
| Lyrics       | What the work involved and how it turned out                |
| Genres       | Skills                                                      |
| Liked Songs  | Awards                                                      |

Every number on the site comes from Darshil's résumé. Darshify is an independent personal project and is not affiliated with or endorsed by Spotify.

## Stack

- React 19 + React Router 7 (framework mode, server rendering, static prerender of every canonical route)
- Vite 8, Tailwind CSS 4, Motion, Base UI
- Vitest + Testing Library, Playwright + axe
- Deployed on Vercel

## Commands

```bash
npm ci                  # install
npm run dev             # dev server on http://localhost:5173
npm run check           # format, lint, type-check, coverage (90% gate) and build
npm run test:e2e        # build, then Playwright + axe browser tests
npm run build           # production build with prerendered HTML in build/client
```

Generated files are committed. Rerun the matching generator when their inputs change:

```bash
npm run generate:crawl         # sitemap.xml, robots.txt, llms.txt, llms-full.txt (content or routes changed)
npm run generate:social-cards  # one 1200×630 share image per route
npm run generate:covers        # cover art and the artist image (after adding a photo)
npm run generate:icons         # favicon.ico, app icons and manifest.webmanifest
npm run resume:metadata        # résumé PDF title and author (after replacing the PDF)
npm run indexnow               # after a production deploy: ask Bing and other IndexNow engines to recrawl
```

## Where things live

| Path                                          | What it holds                                                         |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `src/content/`                                | The typed source of truth: facts, releases, songs, lyrics and sources |
| `src/seo/site.ts`                             | Site identity: canonical origin, brand, locale, title qualifier       |
| `src/seo/`                                    | Route metadata, the route inventory and structured data               |
| `app/routes/`                                 | Route modules (loaders, metadata, 404s)                               |
| `src/pages/`, `src/shell/`, `src/components/` | Pages, app chrome and shared UI                                       |
| `scripts/`                                    | Build-time generators (artwork, social cards, crawl files)            |
| `research/`, `plan/`                          | Research, decisions and the delivery plan (`plan/plan.html`)          |

## How work ships

Work follows the research → plan → execute protocol in `.claude-protocol/`. Each task gets its own `feature/<id>-<slug>` branch and a pull request into the integration branch `feature/spotify-immersion`, which merges only when CI (quality → test → build → browser) is green. The finished redesign reaches production in one pull request into `build/darshify`.

## Owner checklist for search visibility

These steps happen outside the repository, and they matter as much as the code:

1. **Photo.** Add a square portrait (at least 1200 px) as `public/photos/darshil-jain.jpg`. It becomes the artist image, the structured-data image and the image search result.
2. **Domain.** Register `darshiljain.com`, add it in Vercel, set `origin` in `src/seo/site.ts`, rerun `npm run generate:crawl` and `npm run generate:social-cards`, and permanently redirect `wrapped-portfolio.vercel.app` to it.
3. **Search engines.** Verify the site in Google Search Console and Bing Webmaster Tools, submit `/sitemap.xml`, and request indexing for `/` and `/artist`. After each production deploy, run `npm run indexnow`.
4. **Profiles.** Use the same headline everywhere ("Darshil Jain · Operations & Strategy · BBA, MSI Delhi · Founder, Igniters Club"), set a custom LinkedIn URL, and link the site from LinkedIn, Unstop and the résumé's Portfolio link.
5. **Mentions.** Ask Igniters Club, Unstop and competition organizers to link to the site.
