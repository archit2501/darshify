// Renders cover art as an image over its gradient (the gradient shows while the
// image loads or if it's missing/fails). Border radius is inherited from className.
export function Art({ src, gradient, className = "", alt = "" }: {
  src?: string; gradient: string; className?: string; alt?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ background: gradient }}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover block"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
    </div>
  );
}
