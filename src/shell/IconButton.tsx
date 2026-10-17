import type { ReactNode } from "react";

const sizes = {
  sm: "size-8",
  md: "size-9",
  lg: "size-10",
  xl: "size-14",
} as const;

/**
 * The app's round icon control: grey until hover, green with a dot while a
 * toggle is on, and a small dark tooltip with its name, as in the desktop
 * app (drawn by the shared popups/TooltipLayer from `data-tooltip`). The
 * accessible name always comes from `label`. The "bright" tone is
 * for coloured backdrops (the phone's full-screen player), where grey fades.
 */
export function IconButton({
  label,
  onClick,
  pressed,
  disabled = false,
  size = "sm",
  tone = "subdued",
  className = "",
  children,
}: {
  label: string;
  onClick?: () => void;
  /** When set, the button is a toggle (aria-pressed). */
  pressed?: boolean;
  disabled?: boolean;
  size?: keyof typeof sizes;
  tone?: "subdued" | "bright";
  className?: string;
  children: ReactNode;
}) {
  const on = pressed === true;
  return (
    <button
      type="button"
      aria-label={label}
      data-tooltip={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`relative grid shrink-0 place-items-center rounded-full transition-[color,transform] duration-(--dur-hover) active:scale-96 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:hover:scale-104 ${on ? "text-green hover:text-green-hover" : tone === "bright" ? "text-fg" : "text-subdued hover:text-fg"} ${sizes[size]} ${className}`}
    >
      {children}
      {on ? (
        <span
          aria-hidden="true"
          className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-green"
        />
      ) : null}
    </button>
  );
}
