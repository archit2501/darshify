import { describe, expect, it } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import { loader } from "./collection";

describe("collection route loader", () => {
  it("liked alias regression: trailing slash resolves by route identity", () => {
    const result = loader({
      params: {},
      request: new Request("https://darshify.test/liked/"),
    } as LoaderFunctionArgs);

    expect(result).toMatchObject({
      kind: "liked",
      title: "Liked Songs",
      description: expect.stringContaining("achievements"),
    });
  });
});
