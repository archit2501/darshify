import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";
import {
  buildRouteMeta,
  canonicalRouteInventory,
  socialCardPathForRouteId,
  type RouteMetaInput,
} from "../src/seo/meta";

const outputDirectory = fileURLToPath(
  new URL("../public/social-cards/", import.meta.url),
);
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
  Exclude<RouteMetaInput["kind"], "collection" | "case-study">,
  string
> = {
  home: "Recruiter briefing",
  artist: "Professional profile",
  search: "Evidence search",
  library: "Career library",
  liked: "Selected achievements",
};

const categoryFor = (meta: RouteMetaInput): string => {
  if (meta.kind === "collection") {
    return `Evidence collection · ${meta.collection.title}`;
  }
  if (meta.kind === "case-study") {
    return `${meta.caseStudy.kind[0].toUpperCase()}${meta.caseStudy.kind.slice(1)} case study`;
  }
  return fixedCategories[meta.kind];
};

const titleLines = (title: string): string[] => {
  const words = title.split(" ");
  const lines: string[] = [];
  for (const word of words) {
    const current = lines.at(-1);
    if (
      !current ||
      (current.length + word.length + 1 > 34 && lines.length < 3)
    ) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`;
    }
  }
  return lines;
};

const renderSocialCard = (title: string, category: string, routeId: string) => {
  const safeTitle = escapeXml(title);
  const safeCategory = escapeXml(category);
  const safeRouteId = escapeXml(routeId);
  const lines = titleLines(title)
    .map(
      (line, index) =>
        `<tspan x="76" y="${238 + index * 72}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${safeTitle}" data-route-id="${safeRouteId}">
  <title>${safeTitle}</title>
  <desc>Darshify social card. ${safeCategory}: ${safeTitle}.</desc>
  <defs>
    <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#191919"/>
      <stop offset="1" stop-color="#070707"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(1030 86) rotate(135) scale(420)">
      <stop stop-color="#1ed760" stop-opacity=".38"/>
      <stop offset="1" stop-color="#1ed760" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#surface)"/>
  <rect width="1200" height="630" rx="36" fill="url(#glow)"/>
  <g data-motif="proof-wave" aria-label="Evidence signal">
    <rect x="1016" y="70" width="10" height="24" rx="5" fill="#1ed760"/>
    <rect x="1036" y="56" width="10" height="52" rx="5" fill="#1ed760"/>
    <rect x="1056" y="64" width="10" height="36" rx="5" fill="#1ed760"/>
    <rect x="1076" y="44" width="10" height="76" rx="5" fill="#1ed760"/>
    <rect x="1096" y="61" width="10" height="42" rx="5" fill="#1ed760"/>
    <rect x="1116" y="51" width="10" height="62" rx="5" fill="#1ed760"/>
    <rect x="1136" y="73" width="10" height="18" rx="5" fill="#1ed760"/>
  </g>
  <text x="76" y="82" fill="#1ed760" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" letter-spacing="4">DARSHIFY</text>
  <text x="76" y="144" fill="#b3b3b3" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="600" letter-spacing="1">${safeCategory}</text>
  <text fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="55" font-weight="800" letter-spacing="-1.5">${lines}</text>
  <rect x="76" y="548" width="1048" height="2" fill="#2a2a2a"/>
  <text x="76" y="588" fill="#b3b3b3" font-family="Arial, Helvetica, sans-serif" font-size="20">Darshify</text>
</svg>
`;
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

for (const route of canonicalRouteInventory) {
  const fileName = socialCardPathForRouteId(route.id).split("/").at(-1);
  if (!fileName)
    throw new Error(`Missing social-card filename for ${route.id}`);
  const title = titleFor(route.meta);
  const category = categoryFor(route.meta);
  const source = renderSocialCard(title, category, route.id);
  writeFileSync(
    join(sourceDirectory, fileName.replace(/\.png$/, ".svg")),
    source,
  );
  const png = await sharp(Buffer.from(source))
    .png({
      adaptiveFiltering: true,
      colours: 256,
      compressionLevel: 9,
      effort: 10,
      palette: true,
      quality: 90,
    })
    .toBuffer();
  writeFileSync(
    join(outputDirectory, fileName),
    embedRouteIdentity(png, { routeId: route.id, title, category }),
  );
}
