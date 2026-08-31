const authoredDimensions: Record<string, { width: number; height: number }> = {
  "/artifacts/profile-wide.svg": { width: 1280, height: 720 },
  "/artifacts/profile-square.svg": { width: 800, height: 800 },
  "/artifacts/experience.svg": { width: 800, height: 800 },
  "/artifacts/projects.svg": { width: 800, height: 800 },
  "/artifacts/skills.svg": { width: 800, height: 800 },
  "/artifacts/certifications.svg": { width: 800, height: 800 },
  "/artifacts/achievements.svg": { width: 800, height: 800 },
  "/artifacts/education.svg": { width: 800, height: 800 },
};

// Compatibility renderer for legacy views. New evidence surfaces use
// EvidenceCover with a typed Artifact.
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
  const dimensions = src ? authoredDimensions[src] : undefined;

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
