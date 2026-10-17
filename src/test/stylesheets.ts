import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * jsdom's CSS parser drops every rule inside `@layer` blocks, while the app
 * relies on layers so Tailwind utilities beat base styles. Tests that inspect
 * computed styles load the stylesheet through this helper, which unwraps the
 * layer blocks and keeps their rules in source order.
 */
export function flattenCascadeLayers(css: string): string {
  let output = "";
  let cursor = 0;
  const layerOpen = /@layer\s+[\w-]+(?:\s*,\s*[\w-]+)*\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = layerOpen.exec(css))) {
    output += css.slice(cursor, match.index);
    let depth = 1;
    let index = match.index + match[0].length;
    const bodyStart = index;
    while (depth > 0 && index < css.length) {
      if (css[index] === "{") depth += 1;
      if (css[index] === "}") depth -= 1;
      index += 1;
    }
    output += css.slice(bodyStart, index - 1);
    cursor = index;
    layerOpen.lastIndex = index;
  }
  return output + css.slice(cursor);
}

export function readStylesheet(relativePath: string): string {
  return flattenCascadeLayers(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  );
}
