/** Release colours sit behind white text, so they must stay this dark. */
export const MAX_RELEASE_LUMINANCE = 0.18;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const isHexColor = (value: string) => HEX_COLOR.test(value);

const channel = (value: number) => {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

/** WCAG 2.x relative luminance of a #rrggbb colour. */
export function relativeLuminance(hex: string): number {
  if (!isHexColor(hex)) throw new Error(`Not a #rrggbb colour: ${hex}`);
  const [r, g, b] = [1, 3, 5].map((index) =>
    channel(parseInt(hex.slice(index, index + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of white text on the colour. */
export const contrastWithWhite = (hex: string) =>
  1.05 / (relativeLuminance(hex) + 0.05);

/** Mixes a colour toward black; `amount` 0 keeps it, 1 returns black. */
export function darken(hex: string, amount: number): string {
  if (!isHexColor(hex)) throw new Error(`Not a #rrggbb colour: ${hex}`);
  const keep = 1 - Math.min(Math.max(amount, 0), 1);
  return `#${[1, 3, 5]
    .map((index) =>
      Math.round(parseInt(hex.slice(index, index + 2), 16) * keep)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
