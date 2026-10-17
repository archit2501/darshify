// @vitest-environment node
import { describe, expect, it } from "vitest";
import { flattenCascadeLayers, readStylesheet } from "./stylesheets";

describe("flattenCascadeLayers", () => {
  it("unwraps layer blocks, keeping nested rules and order", () => {
    const css = `a{color:red}
@layer base {
  b{color:blue}
  @media (x) { c{color:green} }
}
d{color:black}
@layer components, utilities {
  e{color:white}
}`;
    const flat = flattenCascadeLayers(css);
    expect(flat).not.toContain("@layer");
    expect(flat.indexOf("a{")).toBeLessThan(flat.indexOf("b{"));
    expect(flat.indexOf("b{")).toBeLessThan(flat.indexOf("@media (x) { c{"));
    expect(flat.indexOf("c{")).toBeLessThan(flat.indexOf("d{"));
    expect(flat).toContain("e{color:white}");
  });

  it("loads the real base stylesheet without any layer wrappers", () => {
    const base = readStylesheet("src/styles/base.css");
    expect(base).not.toMatch(/@layer\s/);
    expect(base).toContain(".interactive-target");
  });
});
