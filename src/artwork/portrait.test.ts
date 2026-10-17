// @vitest-environment node
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { relativeLuminance } from "../content/color";
import { processPortrait } from "./portrait";

const workspace = mkdtempSync(join(tmpdir(), "darshify-portrait-"));
afterAll(() => rmSync(workspace, { recursive: true, force: true }));

const photo = async (
  name: string,
  width: number,
  height: number,
  rgb: [number, number, number],
) => {
  const file = join(workspace, name);
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: rgb[0], g: rgb[1], b: rgb[2] },
    },
  })
    .jpeg()
    .toFile(file);
  return file;
};

describe("portrait pipeline", () => {
  it("crops to a square and writes every format at each size it can fill", async () => {
    const source = await photo("wide.jpg", 900, 700, [40, 70, 120]);
    const out = join(workspace, "out-a");
    const portrait = await processPortrait(source, out, "/photos/generated");

    expect(portrait.variants.map((variant) => variant.width)).toEqual([
      256, 640,
    ]);
    for (const variant of portrait.variants) {
      for (const path of [variant.avif, variant.webp, variant.jpg]) {
        expect(path.startsWith("/photos/generated/darshil-jain-")).toBe(true);
        expect(existsSync(join(out, path.split("/").at(-1)!))).toBe(true);
      }
    }
    const meta = await sharp(join(out, "darshil-jain-640.jpg")).metadata();
    expect([meta.width, meta.height]).toEqual([640, 640]);
    expect(portrait.dominantColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("deepens a pale photo's colour so white text stays readable", async () => {
    const source = await photo("pale.jpg", 300, 300, [240, 236, 228]);
    const portrait = await processPortrait(
      source,
      join(workspace, "out-b"),
      "/p",
    );
    expect(relativeLuminance(portrait.dominantColor)).toBeLessThanOrEqual(0.18);
  });

  it("rejects photos too small to look sharp", async () => {
    const source = await photo("tiny.jpg", 120, 120, [10, 10, 10]);
    await expect(
      processPortrait(source, join(workspace, "out-c"), "/p"),
    ).rejects.toThrow("at least 256px");
  });
});
