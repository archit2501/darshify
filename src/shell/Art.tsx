// Generated covers (scripts/generate-covers.ts) are all 600 by 600.
const COVER_SIZE = 600;

// Renderer for authored presentation covers. EvidenceCover is used when a
// surface owns a typed Artifact rather than a typed Collection cover.
export function Art({
  src,
  gradient,
  className = "",
  alt = "",
  priority = false,
}: {
  src?: string;
  gradient: string;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  const dimensions = src?.startsWith("/covers/")
    ? { width: COVER_SIZE, height: COVER_SIZE }
    : undefined;

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ background: gradient }}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          width={dimensions?.width}
          height={dimensions?.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="w-full h-full object-cover block"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}
