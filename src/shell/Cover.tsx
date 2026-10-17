import type { CSSProperties } from "react";
import type { CoverArt } from "../content/artwork";
import type { Portrait } from "../content/types";

export type CoverSize = "xs" | "sm" | "md" | "lg" | "xl" | "fill";

const pixels: Record<Exclude<CoverSize, "fill">, number> = {
  xs: 40,
  sm: 48,
  md: 56,
  lg: 180,
  xl: 232,
};

interface CoverProps {
  art: CoverArt;
  /** Fixed sizes match the app's thumbnail scale; "fill" follows the parent. */
  size?: CoverSize;
  round?: boolean;
  /** Editorial title painted onto the cover. Decorative: the real title is always beside it. */
  label?: string;
  eyebrow?: string;
  /** A real photo replaces the generated artwork when one exists. */
  portrait?: Portrait | null;
  priority?: boolean;
  className?: string;
}

const radiusFor = (size: CoverSize, round: boolean) => {
  if (round) return "rounded-full";
  return size === "xs" || size === "sm" || size === "md"
    ? "rounded-row"
    : "rounded-art";
};

/**
 * Square cover artwork (or another shape via an `aspect-*` class). Covers
 * are decorative (alt="") because every place that shows one also shows the
 * title as text next to it.
 */
export function Cover({
  art,
  size = "fill",
  round = false,
  label,
  eyebrow,
  portrait = null,
  priority = false,
  className = "",
}: CoverProps) {
  const fixed = size === "fill" ? undefined : pixels[size];
  const style: CSSProperties = {
    backgroundColor: portrait?.dominantColor ?? art.color,
    backgroundImage: portrait ? undefined : art.gradient,
    ...(fixed ? { width: fixed, height: fixed } : {}),
  };
  const intrinsic = fixed ?? 600;
  const loading = priority ? "eager" : "lazy";

  return (
    <div
      data-cover={art.seed}
      className={`@container relative shrink-0 overflow-hidden ${/\baspect-/.test(className) ? "" : "aspect-square"} ${radiusFor(size, round)} ${className}`}
      style={style}
    >
      {portrait ? (
        <picture>
          <source
            type="image/avif"
            srcSet={portrait.variants
              .map((v) => `${v.avif} ${v.width}w`)
              .join(", ")}
            sizes={fixed ? `${fixed}px` : "(max-width: 768px) 100vw, 400px"}
          />
          <source
            type="image/webp"
            srcSet={portrait.variants
              .map((v) => `${v.webp} ${v.width}w`)
              .join(", ")}
            sizes={fixed ? `${fixed}px` : "(max-width: 768px) 100vw, 400px"}
          />
          <img
            src={portrait.variants.at(-1)?.jpg}
            alt=""
            width={intrinsic}
            height={intrinsic}
            loading={loading}
            decoding="async"
            fetchPriority={priority ? "high" : undefined}
            className="size-full object-cover"
            draggable={false}
          />
        </picture>
      ) : (
        <img
          src={art.src}
          alt=""
          width={intrinsic}
          height={intrinsic}
          loading={loading}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          className="size-full object-cover"
          draggable={false}
        />
      )}
      {label ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/45 via-transparent to-transparent p-[8cqi] text-white @max-[7rem]:hidden"
        >
          {eyebrow ? (
            <span className="mb-[2cqi] text-[6.5cqi] font-extrabold tracking-[0.06em] uppercase">
              {eyebrow}
            </span>
          ) : null}
          <span className="text-[13cqi] leading-[0.92] font-black tracking-[-0.035em] text-balance">
            {label}
          </span>
        </span>
      ) : null}
    </div>
  );
}
