// Original inline SVG icons (simple geometric glyphs).
type P = { size?: number; className?: string };
const S = ({
  size = 18,
  className,
  children,
}: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export const PlayIcon = (p: P) => (
  <S {...p}>
    <path d="M7 4.5v15l13-7.5z" />
  </S>
);
export const PauseIcon = (p: P) => (
  <S {...p}>
    <path d="M7 4h4v16H7zM13 4h4v16h-4z" />
  </S>
);
export const NextIcon = (p: P) => (
  <S {...p}>
    <path d="M6 5l9 7-9 7zM17 5h2v14h-2z" />
  </S>
);
export const PrevIcon = (p: P) => (
  <S {...p}>
    <path d="M18 5l-9 7 9 7zM5 5h2v14H5z" />
  </S>
);
export const ShuffleIcon = (p: P) => (
  <S {...p}>
    <path
      d="M16 4h5v5M21 4l-7 7M3 6h4l11 12h3M21 20l-7-7M3 18h4l3-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </S>
);
export const RepeatIcon = (p: P) => (
  <S {...p}>
    <path
      d="M4 9V7a3 3 0 013-3h10M20 7l-3-3M20 15v2a3 3 0 01-3 3H7M4 17l3 3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </S>
);
export const HeartIcon = (p: P) => (
  <S {...p}>
    <path
      d="M12 21s-7-4.6-9.5-8.6C.9 9.6 2.3 6 5.5 6c2 0 3.2 1.2 4 2.3C10.3 7.2 11.5 6 13.5 6c3.2 0 4.6 3.6 3 6.4C19 16.4 12 21 12 21z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </S>
);
export const HeartFill = (p: P) => (
  <S {...p}>
    <path d="M12 21s-7-4.6-9.5-8.6C.9 9.6 2.3 6 5.5 6c2 0 3.2 1.2 4 2.3C10.3 7.2 11.5 6 13.5 6c3.2 0 4.6 3.6 3 6.4C19 16.4 12 21 12 21z" />
  </S>
);
export const HomeIcon = (p: P) => (
  <S {...p}>
    <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />
  </S>
);
export const SearchIcon = (p: P) => (
  <S {...p}>
    <path d="M10.5 3a7.5 7.5 0 105.3 12.8l4.2 4.2 1.4-1.4-4.2-4.2A7.5 7.5 0 0010.5 3zm0 2a5.5 5.5 0 110 11 5.5 5.5 0 010-11z" />
  </S>
);
export const LibraryIcon = (p: P) => (
  <S {...p}>
    <path d="M4 4h2v16H4zM8 4h2v16H8zM13 4l6 1.5-4 15L9 19z" />
  </S>
);
export const QueueIcon = (p: P) => (
  <S {...p}>
    <path d="M3 6h12v2H3zM3 11h12v2H3zM3 16h8v2H3zM17 9v8.2a2.5 2.5 0 11-2-2.4V9z" />
  </S>
);
export const VolumeIcon = (p: P) => (
  <S {...p}>
    <path
      d="M4 9v6h4l5 5V4L8 9zM16 8.5a4 4 0 010 7M18.5 6a7 7 0 010 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </S>
);
export const PlusIcon = (p: P) => (
  <S {...p}>
    <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
  </S>
);
