import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import {
  MAX_RELEASE_LUMINANCE,
  darken,
  relativeLuminance,
} from "../content/color";
import type { Portrait } from "../content/types";

export const PORTRAIT_WIDTHS = [256, 640, 1200] as const;

/**
 * Crops a photo to a centred square and writes AVIF, WebP and JPEG copies at
 * each width it can honestly fill. Returns the typed portrait record the site
 * reads, including the photo's dominant colour for headers.
 */
export async function processPortrait(
  sourceFile: string,
  outputDir: string,
  publicPrefix: string,
): Promise<Portrait> {
  const input = sharp(sourceFile).rotate();
  const { width = 0, height = 0 } = await input.metadata();
  const side = Math.min(width, height);
  if (side < PORTRAIT_WIDTHS[0]) {
    throw new Error(
      `Portrait must be at least ${PORTRAIT_WIDTHS[0]}px on its short side`,
    );
  }
  const square = input.extract({
    left: Math.round((width - side) / 2),
    top: Math.round((height - side) / 2),
    width: side,
    height: side,
  });

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  const variants: Portrait["variants"] = [];
  for (const size of PORTRAIT_WIDTHS.filter((candidate) => candidate <= side)) {
    const base = `darshil-jain-${size}`;
    const resized = square.clone().resize(size, size);
    await resized
      .clone()
      .avif({ quality: 55 })
      .toFile(join(outputDir, `${base}.avif`));
    await resized
      .clone()
      .webp({ quality: 78 })
      .toFile(join(outputDir, `${base}.webp`));
    await resized
      .clone()
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(outputDir, `${base}.jpg`));
    variants.push({
      width: size,
      avif: `${publicPrefix}/${base}.avif`,
      webp: `${publicPrefix}/${base}.webp`,
      jpg: `${publicPrefix}/${base}.jpg`,
    });
  }

  const { dominant } = await square.clone().resize(64, 64).stats();
  let dominantColor = `#${[dominant.r, dominant.g, dominant.b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
  // Headers put white text on this colour, so pale photos are deepened.
  while (relativeLuminance(dominantColor) > MAX_RELEASE_LUMINANCE) {
    dominantColor = darken(dominantColor, 0.1);
  }

  return { dominantColor, variants };
}
