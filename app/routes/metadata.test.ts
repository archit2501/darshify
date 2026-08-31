// @vitest-environment node

import { describe, expect, it } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import { portfolio } from "../../src/content/portfolio";
import { buildNotFoundMeta, buildRouteMeta } from "../../src/seo/meta";
import { buildCreativeWorkJsonLd } from "../../src/seo/structuredData";
import { meta as homeMeta } from "./home";
import { meta as artistMeta } from "./artist";
import { meta as searchMeta } from "./search";
import { meta as libraryMeta } from "./library";
import {
  loader as collectionLoader,
  meta as collectionMeta,
} from "./collection";
import { loader as caseLoader, meta as caseMeta } from "./case-study";
import { meta as notFoundMeta } from "./not-found";

const args = (params: Record<string, string | undefined>) =>
  ({
    params,
    request: new Request("https://example.test/"),
  }) as LoaderFunctionArgs;

describe("route metadata adapters", () => {
  it("delegates every fixed route to the canonical metadata builder", () => {
    expect(homeMeta({} as never)).toEqual(buildRouteMeta({ kind: "home" }));
    expect(artistMeta({} as never)).toEqual(
      expect.arrayContaining(buildRouteMeta({ kind: "artist" })),
    );
    expect(searchMeta({} as never)).toEqual(buildRouteMeta({ kind: "search" }));
    expect(libraryMeta({} as never)).toEqual(
      buildRouteMeta({ kind: "library" }),
    );
  });

  it("uses distinct canonical metadata for liked and every collection path", () => {
    const liked = collectionLoader(args({}));
    expect(collectionMeta({ data: liked } as never)).toEqual(
      buildRouteMeta({ kind: "liked" }),
    );

    portfolio.collections.forEach((collection) => {
      const loaded = collectionLoader(args({ id: collection.id }));
      expect(collectionMeta({ data: loaded } as never)).toEqual(
        buildRouteMeta({ kind: "collection", collection }),
      );
    });
  });

  it("publishes canonical case metadata plus supported CreativeWork JSON-LD", () => {
    portfolio.caseStudies.forEach((caseStudy) => {
      const loaded = caseLoader(args({ slug: caseStudy.slug }));
      expect(caseMeta({ data: loaded } as never)).toEqual([
        ...buildRouteMeta({ kind: "case-study", caseStudy }),
        {
          "script:ld+json": buildCreativeWorkJsonLd(
            caseStudy,
            portfolio.candidate,
          ),
        },
      ]);
    });
  });

  it("keeps invalid documents out of search indexes", () => {
    expect(notFoundMeta({} as never)).toEqual(
      buildNotFoundMeta(
        "The requested Darshify portfolio page could not be found.",
      ),
    );
    expect(collectionMeta({ data: null } as never)).toEqual(
      buildNotFoundMeta(
        "The requested portfolio collection could not be found.",
      ),
    );
    expect(caseMeta({ data: null } as never)).toEqual(
      buildNotFoundMeta(
        "The requested Darshify case study could not be found.",
      ),
    );
  });
});
