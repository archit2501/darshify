/**
 * Deterministic, text-free cover artwork. Every release, song and genre gets
 * an original SVG built from its id (the seed) and its colour, so covers stay
 * stable between builds, never borrow anyone's imagery and weigh a few KB.
 *
 * Styles map to what a cover represents:
 *   orbit  experience    rings around a bright body
 *   blocks projects      a Bauhaus-like stack of shapes
 *   rise   leadership    bars rising toward a sun
 *   spark  achievements  four-point stars on a gradient
 *   stack  education     rounded spines, like books on a shelf
 *   seal   credentials   a rosette seal
 *   wave   genres        layered sound-wave bands
 *   vinyl  artist        a record, until a real portrait exists
 */

export type ArtStyle =
  "orbit" | "blocks" | "rise" | "spark" | "stack" | "seal" | "wave" | "vinyl";

export interface ArtSpec {
  seed: string;
  style: ArtStyle;
  color: string;
}

const SIZE = 600;

/* ---------- seeded randomness ---------- */

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = ReturnType<typeof mulberry32>;
const between = (random: Random, min: number, max: number) =>
  min + random() * (max - min);
const pick = <T>(random: Random, values: readonly T[]) =>
  values[Math.floor(random() * values.length)]!;
const round = (value: number) => Math.round(value);

/* ---------- colour ---------- */

interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = [1, 3, 5].map(
    (index) => parseInt(hex.slice(index, index + 2), 16) / 255,
  ) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const hue = (((h % 360) + 360) % 360) / 360;
  const sat = Math.min(Math.max(s, 0), 1);
  const lig = Math.min(Math.max(l, 0), 1);
  const toChannel = (t: number) => {
    const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
    const p = 2 * lig - q;
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    const value =
      x < 1 / 6
        ? p + (q - p) * 6 * x
        : x < 1 / 2
          ? q
          : x < 2 / 3
            ? p + (q - p) * (2 / 3 - x) * 6
            : p;
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${toChannel(hue + 1 / 3)}${toChannel(hue)}${toChannel(hue - 1 / 3)}`;
}

export interface Palette {
  base: string;
  deep: string;
  ink: string;
  light: string;
  glow: string;
  accent: string;
}

export function paletteFor(color: string): Palette {
  const { h, s, l } = hexToHsl(color);
  return {
    base: color,
    deep: hslToHex({ h, s: s * 0.95, l: l * 0.55 }),
    ink: hslToHex({ h, s: s * 0.6, l: 0.07 }),
    light: hslToHex({ h: h - 8, s: Math.min(s * 1.05, 0.95), l: 0.68 }),
    glow: hslToHex({ h: h + 12, s: Math.min(s * 1.1, 1), l: 0.82 }),
    accent: hslToHex({ h: h + 150, s: 0.75, l: 0.6 }),
  };
}

/* ---------- shared defs ---------- */

const gradientDefs = (id: string, palette: Palette, random: Random) => {
  const x = round(between(random, 0, 40));
  const y = round(between(random, 0, 40));
  return `<defs><radialGradient id="${id}g" cx="${x}%" cy="${y}%" r="95%"><stop offset="0" stop-color="${palette.light}" stop-opacity=".55"/><stop offset=".55" stop-color="${palette.base}" stop-opacity="0"/></radialGradient><filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .07 0"/></filter></defs>`;
};

const frame = (id: string, palette: Palette, random: Random, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">${gradientDefs(id, palette, random)}<rect width="${SIZE}" height="${SIZE}" fill="${palette.base}"/>${body}<rect width="${SIZE}" height="${SIZE}" fill="url(#${id}g)"/><rect width="${SIZE}" height="${SIZE}" filter="url(#${id}n)"/></svg>`;

/* ---------- styles ---------- */

const orbit = (random: Random, p: Palette) => {
  const cx = round(between(random, 230, 400));
  const cy = round(between(random, 230, 400));
  const r = round(between(random, 120, 170));
  const rings = Array.from({ length: 4 }, (_, index) => {
    const ringR = round(r + 46 * (index + 1) + between(random, -8, 8));
    const width = round(between(random, 2, 6));
    return `<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${p.glow}" stroke-opacity="${(0.5 - index * 0.1).toFixed(2)}" stroke-width="${width}"/>`;
  }).join("");
  const moonAngle = between(random, 0, Math.PI * 2);
  const moonDistance = r + 92;
  const mx = round(cx + Math.cos(moonAngle) * moonDistance);
  const my = round(cy + Math.sin(moonAngle) * moonDistance);
  return `${rings}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.light}"/><circle cx="${cx - round(r * 0.28)}" cy="${cy - round(r * 0.28)}" r="${round(r * 0.62)}" fill="${p.glow}" fill-opacity=".55"/><circle cx="${mx}" cy="${my}" r="${round(between(random, 16, 26))}" fill="${p.accent}"/>`;
};

const blocks = (random: Random, p: Palette) => {
  const unit = 150;
  const shapes: string[] = [];
  const fills = [p.light, p.deep, p.accent, p.glow, p.ink];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      if (random() < 0.45) continue;
      const x = col * unit;
      const y = row * unit;
      const fill = pick(random, fills);
      const kind = Math.floor(random() * 4);
      if (kind === 0) {
        shapes.push(
          `<rect x="${x}" y="${y}" width="${unit}" height="${unit}" fill="${fill}"/>`,
        );
      } else if (kind === 1) {
        shapes.push(
          `<circle cx="${x + 75}" cy="${y + 75}" r="70" fill="${fill}"/>`,
        );
      } else {
        const corner = Math.floor(random() * 4);
        const ox = corner % 2 === 0 ? x : x + unit;
        const oy = corner < 2 ? y : y + unit;
        const sx = corner % 2 === 0 ? 1 : -1;
        const sy = corner < 2 ? 1 : -1;
        shapes.push(
          `<path d="M${ox} ${oy}h${sx * unit}A${unit} ${unit} 0 0 ${sx * sy > 0 ? 1 : 0} ${ox} ${oy + sy * unit}Z" fill="${fill}"/>`,
        );
      }
    }
  }
  return shapes.join("");
};

const rise = (random: Random, p: Palette) => {
  const sunX = round(between(random, 180, 420));
  const sun = `<circle cx="${sunX}" cy="${round(between(random, 150, 230))}" r="${round(between(random, 70, 100))}" fill="${p.glow}"/>`;
  const bars = Array.from({ length: 9 }, (_, index) => {
    const height = round(between(random, 120, 420) * (0.55 + index / 18));
    const x = 18 + index * 64;
    return `<rect x="${x}" y="${SIZE - height}" width="48" height="${height + 12}" rx="12" fill="${index % 3 === 0 ? p.light : p.deep}" fill-opacity="${index % 3 === 0 ? 0.95 : 0.85}"/>`;
  }).join("");
  return `${sun}${bars}<rect y="560" width="${SIZE}" height="40" fill="${p.ink}" fill-opacity=".5"/>`;
};

const star = (x: number, y: number, r: number, fill: string, opacity = 1) =>
  `<path d="M${x} ${y - r}C${x + r * 0.16} ${y - r * 0.16} ${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y}C${x + r * 0.16} ${y + r * 0.16} ${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r}C${x - r * 0.16} ${y + r * 0.16} ${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y}C${x - r * 0.16} ${y - r * 0.16} ${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r}Z" fill="${fill}" fill-opacity="${opacity}"/>`.replace(
    /(\d+\.\d)\d+/g,
    "$1",
  );

const spark = (random: Random, p: Palette) => {
  const big = star(
    round(between(random, 230, 370)),
    round(between(random, 230, 370)),
    round(between(random, 150, 190)),
    p.glow,
  );
  const small = Array.from({ length: 7 }, () =>
    star(
      round(between(random, 40, 560)),
      round(between(random, 40, 560)),
      round(between(random, 14, 40)),
      pick(random, [p.light, p.glow, p.accent]),
      Number(between(random, 0.6, 1).toFixed(2)),
    ),
  ).join("");
  return `<rect width="${SIZE}" height="${SIZE}" fill="${p.deep}" fill-opacity=".45"/>${small}${big}`;
};

const stack = (random: Random, p: Palette) => {
  const spines: string[] = [];
  let x = 40;
  while (x < 540) {
    const width = round(between(random, 44, 86));
    const height = round(between(random, 300, 470));
    const tilt = random() < 0.18 ? round(between(random, -9, 9)) : 0;
    const fill = pick(random, [p.light, p.glow, p.deep, p.accent]);
    spines.push(
      `<g transform="rotate(${tilt} ${x + width / 2} 540)"><rect x="${x}" y="${540 - height}" width="${width}" height="${height}" rx="10" fill="${fill}"/><rect x="${x + 10}" y="${560 - height}" width="${width - 20}" height="10" rx="5" fill="${p.ink}" fill-opacity=".35"/></g>`,
    );
    x += width + round(between(random, 6, 14));
  }
  return `${spines.join("")}<rect x="20" y="540" width="560" height="22" rx="6" fill="${p.ink}" fill-opacity=".6"/>`;
};

const seal = (random: Random, p: Palette) => {
  const cx = 300;
  const cy = round(between(random, 270, 330));
  const points = 18;
  const outer = 210;
  const inner = 186;
  const path = Array.from({ length: points * 2 }, (_, index) => {
    const angle = (Math.PI * index) / points;
    const r = index % 2 === 0 ? outer : inner;
    return `${index === 0 ? "M" : "L"}${round(cx + Math.cos(angle) * r)} ${round(cy + Math.sin(angle) * r)}`;
  }).join("");
  const ribbons = `<path d="M230 ${cy + 150}l-40 150 60-30 30 60 30-150Z" fill="${p.deep}"/><path d="M370 ${cy + 150}l40 150-60-30-30 60-30-150Z" fill="${p.deep}"/>`;
  return `${ribbons}<path d="${path}Z" fill="${p.light}"/><circle cx="${cx}" cy="${cy}" r="150" fill="${p.glow}"/><circle cx="${cx}" cy="${cy}" r="118" fill="none" stroke="${p.base}" stroke-width="6" stroke-dasharray="${round(between(random, 4, 10))} 10"/><circle cx="${cx}" cy="${cy}" r="${round(between(random, 46, 66))}" fill="${p.accent}"/>`;
};

const wave = (random: Random, p: Palette) => {
  const bands = [p.light, p.glow, p.accent, p.deep, p.ink];
  return bands
    .map((fill, index) => {
      const y = 170 + index * 92;
      const amplitude = between(random, 26, 60);
      const frequency = between(random, 1.2, 2.4);
      const phase = between(random, 0, Math.PI * 2);
      const top = Array.from({ length: 13 }, (_, step) => {
        const x = step * 50;
        const yy =
          y +
          Math.sin((step / 12) * Math.PI * 2 * frequency + phase) * amplitude;
        return `${step === 0 ? "M" : "L"}${x} ${round(yy)}`;
      }).join("");
      return `<path d="${top}L600 600L0 600Z" fill="${fill}" fill-opacity="${index === 4 ? 0.7 : 0.92}"/>`;
    })
    .join("");
};

const vinyl = (random: Random, p: Palette) => {
  const cx = round(between(random, 300, 340));
  const cy = 300;
  const grooves = Array.from(
    { length: 7 },
    (_, index) =>
      `<circle cx="${cx}" cy="${cy}" r="${236 - index * 22}" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="2"/>`,
  ).join("");
  return `<circle cx="${cx}" cy="${cy}" r="260" fill="#0b0b0b"/>${grooves}<path d="M${cx - 200} ${cy - 120}A240 240 0 0 1 ${cx + 40} ${cy - 236}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="10" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="92" fill="${p.light}"/><circle cx="${cx}" cy="${cy}" r="62" fill="${p.accent}"/><circle cx="${cx}" cy="${cy}" r="12" fill="#0b0b0b"/>`;
};

const painters: Record<ArtStyle, (random: Random, palette: Palette) => string> =
  {
    orbit,
    blocks,
    rise,
    spark,
    stack,
    seal,
    wave,
    vinyl,
  };

/** Builds one cover as an SVG document string. Same spec, same bytes. */
export function renderArt({ seed, style, color }: ArtSpec): string {
  const random = mulberry32(hashSeed(`${style}:${seed}`));
  const palette = paletteFor(color);
  const id = `a${hashSeed(seed).toString(36).slice(0, 5)}`;
  const body = painters[style](random, palette);
  return frame(id, palette, random, body);
}
