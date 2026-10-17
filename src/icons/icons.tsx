import type { ReactNode } from "react";

// Darshify's own icon set: a 24px grid, 2px round strokes for outline glyphs
// and soft-cornered fills for transport controls. Decorative by default; pass
// `title` only when an icon is the sole label of something.
type IconProps = { size?: number; className?: string; title?: string };

function Svg({
  size = 24,
  className,
  title,
  children,
  stroke = false,
}: IconProps & { children: ReactNode; stroke?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      fill={stroke ? "none" : "currentColor"}
      stroke={stroke ? "currentColor" : undefined}
      strokeWidth={stroke ? 2 : undefined}
      strokeLinecap={stroke ? "round" : undefined}
      strokeLinejoin={stroke ? "round" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function Outline({ d, ...p }: IconProps & { d: string }) {
  return (
    <Svg {...p} stroke>
      <path d={d} />
    </Svg>
  );
}

function Filled({ d, ...p }: IconProps & { d: string }) {
  return (
    <Svg {...p}>
      <path d={d} />
    </Svg>
  );
}

/* Transport */
export const PlayIcon = (p: IconProps) => (
  <Filled
    {...p}
    d={
      "M8 5.3v13.4c0 .8.9 1.3 1.6.9l10.6-6.7a1 1 0 0 0 0-1.8L9.6 4.4A1 1 0 0 0 8 5.3Z"
    }
  />
);
export const PauseIcon = (p: IconProps) => (
  <Filled
    {...p}
    d={
      "M6.5 4.5h3a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Zm8 0h3a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
    }
  />
);
export const NextIcon = (p: IconProps) => (
  <Filled
    {...p}
    d={
      "M5 6.1v11.8c0 .8.9 1.3 1.6.8l8.7-5.9a1 1 0 0 0 0-1.6L6.6 5.3C5.9 4.8 5 5.3 5 6.1ZM17 5.5a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1v-13Z"
    }
  />
);
export const PrevIcon = (p: IconProps) => (
  <Filled
    {...p}
    d={
      "M19 6.1v11.8c0 .8-.9 1.3-1.6.8l-8.7-5.9a1 1 0 0 1 0-1.6l8.7-5.9c.7-.5 1.6 0 1.6.8ZM7 5.5a1 1 0 0 0-1-1h-.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H6a1 1 0 0 0 1-1v-13Z"
    }
  />
);
export const ShuffleIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={
      "M3 7h2.8c1.9 0 3 .8 4 2.4l3.4 5.2c1 1.6 2.1 2.4 4 2.4H20M17.5 14.5 20 17l-2.5 2.5M3 17h2.8c1.1 0 1.9-.3 2.6-.8M14.6 7.8c.7-.5 1.5-.8 2.6-.8H20M17.5 4.5 20 7l-2.5 2.5"
    }
  />
);
export const RepeatIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={
      "M17 3.5 19.5 6 17 8.5M4.5 11V9a3 3 0 0 1 3-3h12M7 20.5 4.5 18 7 15.5M19.5 13v2a3 3 0 0 1-3 3h-12"
    }
  />
);
export const RepeatOneIcon = (p: IconProps) => (
  <Svg {...p} stroke>
    <path d="M17 3.5 19.5 6 17 8.5M4.5 11V9a3 3 0 0 1 3-3h12M7 20.5 4.5 18 7 15.5M19.5 13v2a3 3 0 0 1-3 3h-12" />
    <path d="M11 10.5 12.5 9.5v5" strokeWidth={1.75} />
  </Svg>
);

/* Navigation */
export const HomeIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={
      "M4 10.4 12 4l8 6.4V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.6Z"
    }
  />
);
export const HomeFilledIcon = (p: IconProps) => (
  <Filled
    {...p}
    d={
      "M12.6 3.2a1 1 0 0 0-1.2 0l-8 6.4a1 1 0 0 0-.4.8V20a1 1 0 0 0 1 1h5.5v-6.5h5V21H20a1 1 0 0 0 1-1v-9.6a1 1 0 0 0-.4-.8l-8-6.4Z"
    }
  />
);
export const SearchIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={
      "M10.75 17.5a6.75 6.75 0 1 0 0-13.5 6.75 6.75 0 0 0 0 13.5ZM15.6 15.6 20.5 20.5"
    }
  />
);
export const LibraryIcon = (p: IconProps) => (
  <Outline {...p} d={"M5 4v16M9.5 4v16M14 4.6l5 14.8"} />
);
export const BrowseIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={
      "M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5v-4ZM13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 13 9.5v-4ZM4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-4ZM13 14.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4Z"
    }
  />
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Outline {...p} d={"M14.5 5.5 8 12l6.5 6.5"} />
);
export const ChevronRightIcon = (p: IconProps) => (
  <Outline {...p} d={"M9.5 5.5 16 12l-6.5 6.5"} />
);
export const ChevronDownIcon = (p: IconProps) => (
  <Outline {...p} d={"M5.5 9.5 12 16l6.5-6.5"} />
);
export const ChevronUpIcon = (p: IconProps) => (
  <Outline {...p} d={"M5.5 14.5 12 8l6.5 6.5"} />
);
export const ArrowRightIcon = (p: IconProps) => (
  <Outline {...p} d={"M5 12h14M13 6l6 6-6 6"} />
);
export const ArrowLeftIcon = (p: IconProps) => (
  <Outline {...p} d={"M19 12H5M11 6l-6 6 6 6"} />
);
export const CloseIcon = (p: IconProps) => (
  <Outline {...p} d={"M6 6l12 12M18 6 6 18"} />
);
export const ExpandIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={"M4 9.5V4h5.5M14.5 4H20v5.5M20 14.5V20h-5.5M9.5 20H4v-5.5"}
  />
);
export const CollapseIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={"M9.5 4v5.5H4M20 9.5h-5.5V4M14.5 20v-5.5H20M4 14.5h5.5V20"}
  />
);

/* Panels */
export const QueueIcon = (p: IconProps) => (
  <Svg {...p} stroke>
    <path d="M4 6h11M4 11h11M4 16h6M19 7.5V17" />
    <circle cx="16.5" cy="17" r="2.5" />
  </Svg>
);
export const LyricsIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={
      "M12 3.5a3 3 0 0 1 3 3V11a3 3 0 0 1-6 0V6.5a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6"
    }
  />
);
export const NowPlayingViewIcon = (p: IconProps) => (
  <Svg {...p} stroke>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M15 4.5v15" />
    <path d="M7 9.75v4.5l3.75-2.25L7 9.75Z" fill="currentColor" stroke="none" />
  </Svg>
);
export const ListIcon = (p: IconProps) => (
  <Outline {...p} d={"M4 6h16M4 12h16M4 18h16"} />
);
export const CompactListIcon = (p: IconProps) => (
  <Outline {...p} d={"M4 5h16M4 9.67h16M4 14.33h16M4 19h16"} />
);
export const GridIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={"M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z"}
  />
);
export const ClockIcon = (p: IconProps) => (
  <Svg {...p} stroke>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

/* Volume */
const speaker =
  "M4 9.5h3.25L12 5.75v12.5L7.25 14.5H4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5Z";
export const VolumeMuteIcon = (p: IconProps) => (
  <Outline {...p} d={`${speaker}M16 9.5l4.5 4.5M20.5 9.5 16 14`} />
);
export const VolumeLowIcon = (p: IconProps) => (
  <Outline {...p} d={`${speaker}M15.5 9.75a3 3 0 0 1 0 4.5`} />
);
export const VolumeMidIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={`${speaker}M15.5 9.75a3 3 0 0 1 0 4.5M18 7.5a6.5 6.5 0 0 1 0 9`}
  />
);
export const VolumeIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={`${speaker}M15.5 9.75a3 3 0 0 1 0 4.5M18 7.5a6.5 6.5 0 0 1 0 9M20.25 5.25a9.6 9.6 0 0 1 0 13.5`}
  />
);
export const SpeakerIcon = (p: IconProps) => <VolumeMidIcon {...p} />;

/* Saving and actions */
const heart =
  "M12 19.6s-7.6-4.5-8.9-9.2C2.2 7.2 4.2 4.4 7.1 4.4c2 0 3.5 1.1 4.9 3 1.4-1.9 2.9-3 4.9-3 2.9 0 4.9 2.8 4 6C19.6 15.1 12 19.6 12 19.6Z";
export const HeartIcon = (p: IconProps) => <Outline {...p} d={heart} />;
export const HeartFill = (p: IconProps) => <Filled {...p} d={heart} />;
export const PlusIcon = (p: IconProps) => (
  <Outline {...p} d={"M12 5v14M5 12h14"} />
);
export const PlusCircleIcon = (p: IconProps) => (
  <Svg {...p} stroke>
    <circle cx="12" cy="12" r="8.75" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
);
export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" />
    <path
      d="m7.75 12.25 2.75 2.75 5.75-6"
      fill="none"
      stroke="var(--color-app, #000)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Outline {...p} d={"m5 12.5 4.5 4.5L19 7.5"} />
);
export const MoreIcon = (p: IconProps) => (
  <Filled
    {...p}
    d={
      "M5.5 13.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm6.5 0a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm6.5 0a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z"
    }
  />
);
export const DownloadIcon = (p: IconProps) => (
  <Outline {...p} d={"M12 4v11M7 10.5l5 5 5-5M5 19.5h14"} />
);
export const DownloadCircleIcon = (p: IconProps) => (
  <Svg {...p} stroke>
    <circle cx="12" cy="12" r="8.75" />
    <path d="M12 7.5v8M8.75 12.5 12 15.75l3.25-3.25" />
  </Svg>
);
export const ShareIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={
      "M12 15V3.5M7.5 8 12 3.5 16.5 8M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5"
    }
  />
);
export const LinkIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={
      "M10 14a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"
    }
  />
);
export const ExternalLinkIcon = (p: IconProps) => (
  <Outline
    {...p}
    d={
      "M14 4h6v6M20 4l-8.5 8.5M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"
    }
  />
);
export const PinIcon = (p: IconProps) => (
  <Filled
    {...p}
    d={
      "M14.9 2.6a1 1 0 0 1 1.4 0l5.1 5.1a1 1 0 0 1 0 1.4l-.7.7a2 2 0 0 1-1.6.6l-1.7-.2-3 3 .4 3a2 2 0 0 1-.6 1.6l-1 1a1 1 0 0 1-1.4 0l-3.2-3.2-4.4 4.4a1 1 0 0 1-1.4-1.4l4.4-4.4-3.2-3.2a1 1 0 0 1 0-1.4l1-1a2 2 0 0 1 1.6-.6l3 .4 3-3-.2-1.7a2 2 0 0 1 .6-1.6l.7-.7Z"
    }
  />
);
export const KeyboardIcon = (p: IconProps) => (
  <Svg {...p} stroke>
    <rect x="2.75" y="6" width="18.5" height="12" rx="2" />
    <path d="M6.5 9.75h.01M10 9.75h.01M13.5 9.75h.01M17 9.75h.01M8 14.25h8" />
  </Svg>
);
export const UserIcon = (p: IconProps) => (
  <Svg {...p} stroke>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Svg>
);
export const SparkIcon = (p: IconProps) => (
  <Filled
    {...p}
    d={
      "M12 2.75c.4 0 .75.27.86.66l1.3 4.43a2 2 0 0 0 1.36 1.36l4.43 1.3a.9.9 0 0 1 0 1.72l-4.43 1.3a2 2 0 0 0-1.36 1.36l-1.3 4.43a.9.9 0 0 1-1.72 0l-1.3-4.43a2 2 0 0 0-1.36-1.36l-4.43-1.3a.9.9 0 0 1 0-1.72l4.43-1.3a2 2 0 0 0 1.36-1.36l1.3-4.43c.11-.39.46-.66.86-.66Z"
    }
  />
);

/* Contact */
export const MailIcon = (p: IconProps) => (
  <Outline {...p} d={"M3.5 6.5h17v11h-17zM4 7l8 6.25L20 7"} />
);
export const LinkedInIcon = (p: IconProps) => (
  <Filled
    {...p}
    d={
      "M5.2 8.3H2.6V21h2.6V8.3ZM3.9 3a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 3.9 3Zm17.5 10.7c0-3.8-2-5.6-4.8-5.6-2.2 0-3.2 1.2-3.8 2.1V8.3h-2.6V21h2.6v-6.3c0-1.7.3-3.3 2.4-3.3 2 0 2.1 1.9 2.1 3.4V21h2.6v-7.3h1.5Z"
    }
  />
);

/* Brand: an original mark (a play glyph in a circle); never Spotify's arcs. */
export function DarshifyMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      focusable="false"
    >
      <circle cx="16" cy="16" r="16" fill="var(--color-green, #1ed760)" />
      <path
        d="M12.5 9.6v12.8c0 .8.9 1.3 1.6.9l10-6.4a1 1 0 0 0 0-1.8l-10-6.4c-.7-.4-1.6.1-1.6.9Z"
        fill="#000"
      />
    </svg>
  );
}
