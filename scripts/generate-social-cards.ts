import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";
import {
  buildRouteMeta,
  canonicalRouteInventory,
  socialCardPathForRouteId,
  type RouteMetaInput,
} from "../src/seo/meta";
import {
  artistArt,
  genreArt,
  releaseArt,
  songArt,
  type CoverArt,
} from "../src/content/artwork";
import { portfolio } from "../src/content/portfolio";
import { LIKED_RELEASE_ID } from "../src/content/selectors";

const outputDirectory = fileURLToPath(
  new URL("../public/social-cards/", import.meta.url),
);
const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const sourceDirectory = fileURLToPath(
  new URL("./generated-social-card-sources/", import.meta.url),
);

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );

const titleFor = (meta: RouteMetaInput): string => {
  const title = buildRouteMeta(meta).find(
    (descriptor) => "title" in descriptor,
  );
  if (!title || !("title" in title) || typeof title.title !== "string") {
    throw new Error("Every social card requires route title metadata");
  }
  return title.title;
};

const fixedCategories: Record<
  Exclude<RouteMetaInput["kind"], "collection" | "case-study" | "genre">,
  string
> = {
  home: "Recruiter briefing",
  artist: "Professional profile",
  search: "Evidence search",
  library: "Career library",
  liked: "Selected achievements",
  rewind: "Year in review",
};

const categoryFor = (meta: RouteMetaInput): string => {
  if (meta.kind === "collection") {
    return `Evidence collection · ${meta.collection.title}`;
  }
  if (meta.kind === "genre") {
    return `Skill · ${meta.genre.skill}`;
  }
  if (meta.kind === "case-study") {
    return `${meta.caseStudy.kind[0].toUpperCase()}${meta.caseStudy.kind.slice(1)} case study`;
  }
  return fixedCategories[meta.kind];
};

mkdirSync(outputDirectory, { recursive: true });
mkdirSync(sourceDirectory, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const crc32 = (buffer: Buffer) => {
  let checksum = 0xffffffff;
  for (const value of buffer) {
    checksum = crcTable[(checksum ^ value) & 0xff] ^ (checksum >>> 8);
  }
  return (checksum ^ 0xffffffff) >>> 0;
};

const pngChunk = (type: string, data: Buffer) => {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
};

const embedRouteIdentity = (
  png: Buffer,
  identity: { routeId: string; title: string; category: string },
) => {
  const iend = png.subarray(-12);
  if (iend.subarray(4, 8).toString("ascii") !== "IEND") {
    throw new Error("Rasterizer returned an invalid PNG without IEND");
  }
  const data = Buffer.concat([
    Buffer.from("DarshifyRoute", "latin1"),
    Buffer.from([0, 0, 0, 0, 0]),
    Buffer.from(JSON.stringify(identity), "utf8"),
  ]);
  return Buffer.concat([png.subarray(0, -12), pngChunk("iTXt", data), iend]);
};

const coverFor = (meta: RouteMetaInput): CoverArt => {
  switch (meta.kind) {
    case "collection":
      return releaseArt(meta.collection);
    case "case-study":
      return songArt(meta.caseStudy);
    case "genre":
      return genreArt(meta.genre);
    case "liked": {
      const achievements = portfolio.collections.find(
        (release) => release.id === LIKED_RELEASE_ID,
      );
      return achievements ? releaseArt(achievements) : artistArt;
    }
    default:
      return artistArt;
  }
};

const wrapTitle = (title: string, maxChars = 21, maxLines = 3) => {
  const lines: string[] = [];
  for (const word of title.split(" ")) {
    const current = lines.at(-1);
    if (!current || current.length + word.length + 1 > maxChars) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`;
    }
  }
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/[\s,.;:—-]+$/, "")}…`;
  return kept;
};

const COVER = { x: 72, y: 115, size: 400 };

const renderSocialCard = (
  title: string,
  category: string,
  routeId: string,
  color: string,
) => {
  const safeTitle = escapeXml(title);
  const safeCategory = escapeXml(category.toUpperCase());
  const safeRouteId = escapeXml(routeId);
  // The card already shows the name, so the title drops its " — Darshil
  // Jain" suffix; the page title stays whole in the embedded identity.
  const lines = wrapTitle(
    title.replace(/ \| Darshify$/, "").replace(/ — Darshil Jain$/, ""),
  );
  const fontSize = lines.length > 2 ? 52 : 60;
  const lineHeight = fontSize * 1.08;
  const firstBaseline = 315 - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="528" y="${Math.round(firstBaseline + index * lineHeight)}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  const nameY = Math.round(firstBaseline + lines.length * lineHeight + 24);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${safeTitle}" data-route-id="${safeRouteId}">
  <title>${safeTitle}</title>
  <desc>Darshify social card for Darshil Jain. ${escapeXml(category)}: ${safeTitle}.</desc>
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="#121212"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#121212"/>
  <rect width="1200" height="630" fill="url(#wash)"/>
  <rect x="${COVER.x + 6}" y="${COVER.y + 14}" width="${COVER.size}" height="${COVER.size}" rx="12" fill="#000" opacity=".45"/>
  <text x="528" y="${Math.round(firstBaseline - fontSize - 18)}" fill="#ffffff" fill-opacity=".8" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="3">${safeCategory}</text>
  <text fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-1.5">${tspans}</text>
  <circle cx="545" cy="${nameY - 9}" r="17" fill="#1ed760"/>
  <text x="575" y="${nameY}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Darshil Jain</text>
  <g data-motif="proof-wave" aria-label="Evidence signal">
    <rect x="1016" y="546" width="10" height="24" rx="5" fill="#1ed760"/>
    <rect x="1036" y="532" width="10" height="52" rx="5" fill="#1ed760"/>
    <rect x="1056" y="540" width="10" height="36" rx="5" fill="#1ed760"/>
    <rect x="1076" y="520" width="10" height="76" rx="5" fill="#1ed760"/>
    <rect x="1096" y="537" width="10" height="42" rx="5" fill="#1ed760"/>
    <rect x="1116" y="527" width="10" height="62" rx="5" fill="#1ed760"/>
    <rect x="1136" y="549" width="10" height="18" rx="5" fill="#1ed760"/>
  </g>
  <text x="${COVER.x}" y="588" fill="#1ed760" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="4">DARSHIFY</text>
</svg>
`;
};

/** The cover, without its film-grain overlay (grain makes PNGs heavy). */
const coverPng = async (art: CoverArt) => {
  const svg = readFileSync(join(publicDirectory, art.src), "utf8").replace(
    /<rect[^>]*filter="url\(#[^)]+\)"[^>]*\/>/g,
    "",
  );
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${COVER.size}" height="${COVER.size}"><rect width="${COVER.size}" height="${COVER.size}" rx="12" fill="#fff"/></svg>`,
  );
  return sharp(Buffer.from(svg))
    .resize(COVER.size, COVER.size)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
};

for (const route of canonicalRouteInventory) {
  const fileName = socialCardPathForRouteId(route.id).split("/").at(-1);
  if (!fileName)
    throw new Error(`Missing social-card filename for ${route.id}`);
  const title = titleFor(route.meta);
  const category = categoryFor(route.meta);
  const art = coverFor(route.meta);
  const source = renderSocialCard(title, category, route.id, art.color);
  writeFileSync(
    join(sourceDirectory, fileName.replace(/\.png$/, ".svg")),
    source,
  );
  const png = await sharp(Buffer.from(source))
    .composite([{ input: await coverPng(art), top: COVER.y, left: COVER.x }])
    .png({
      adaptiveFiltering: true,
      colours: 220,
      dither: 0,
      compressionLevel: 9,
      effort: 10,
      palette: true,
      quality: 100,
    })
    .toBuffer();
  writeFileSync(
    join(outputDirectory, fileName),
    embedRouteIdentity(png, { routeId: route.id, title, category }),
  );
}
