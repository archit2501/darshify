import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";
import { portfolio } from "../src/content/portfolio";
import { SITE } from "../src/seo/site";

// App icons and the web manifest, drawn from the same mark as favicon.svg:
// a green disc with a play glyph (Darshify's own mark, not a streaming
// service's logo).
const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const iconDirectory = join(publicDirectory, "icons");
mkdirSync(iconDirectory, { recursive: true });

/** The mark centred on a square, scaled to `scale` of the canvas. */
const markSvg = (size: number, scale: number, background: string | null) => {
  const radius = (size * scale) / 2;
  const centre = size / 2;
  const unit = radius / 32;
  // Play triangle from favicon.svg (M25 20v24l19-12z on a 64-unit disc).
  const x = (value: number) => centre + (value - 32) * unit;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ""}
  <circle cx="${centre}" cy="${centre}" r="${radius}" fill="#1ed760"/>
  <path d="M${x(25)} ${x(20)}V${x(44)}L${x(44)} ${x(32)}Z" fill="#000"/>
</svg>`;
};

const icons = [
  { file: "icon-192.png", size: 192, scale: 1, background: null },
  { file: "icon-512.png", size: 512, scale: 1, background: null },
  // Maskable icons keep the mark inside the 80% safe zone.
  {
    file: "icon-maskable-512.png",
    size: 512,
    scale: 0.62,
    background: "#121212",
  },
  // iOS ignores transparency, so the touch icon carries the app background.
  {
    file: "apple-touch-icon.png",
    size: 180,
    scale: 0.72,
    background: "#121212",
  },
];

for (const icon of icons) {
  const png = await sharp(
    Buffer.from(markSvg(icon.size, icon.scale, icon.background)),
  )
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  writeFileSync(join(iconDirectory, icon.file), png);
}

/** A .ico of PNG images: what /favicon.ico requests and older clients get. */
const icoFrom = (images: Array<{ size: number; png: Buffer }>) => {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
};

const favicons = await Promise.all(
  [32, 48].map(async (size) => ({
    size,
    png: await sharp(Buffer.from(markSvg(size, 1, null)))
      .png({ compressionLevel: 9 })
      .toBuffer(),
  })),
);
writeFileSync(join(publicDirectory, "favicon.ico"), icoFrom(favicons));

const manifest = {
  name: `${SITE.brand} — ${portfolio.candidate.name}`,
  short_name: SITE.brand,
  description: `${portfolio.candidate.name}'s portfolio: ${portfolio.candidate.headline}.`,
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#000000",
  theme_color: SITE.themeColor,
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    {
      src: "/icons/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};
writeFileSync(
  join(publicDirectory, "manifest.webmanifest"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `Wrote ${icons.length} icons, favicon.ico and manifest.webmanifest`,
);
