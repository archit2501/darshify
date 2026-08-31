export function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="max-w-2xl">
      <label
        htmlFor="portfolio-search"
        className="mb-2 block text-body font-bold text-text"
      >
        Search experience, skills, and evidence
      </label>
      <p id="portfolio-search-hint" className="mb-3 text-metadata text-muted">
        Search organizations, skills, actions, outcomes, takeaways, or sources.
      </p>
      <div className="flex gap-2">
        <input
          id="portfolio-search"
          name="portfolio-search"
          type="search"
          autoComplete="off"
          aria-describedby="portfolio-search-hint"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Try Figmenta, Excel, or strategy"
          className="min-h-11 w-full rounded-full border border-line bg-text px-5 py-3 font-medium text-ink outline-none transition-colors duration-[var(--transition-hover)] focus-visible:border-signal"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="min-h-11 shrink-0 rounded-full border border-line px-4 font-bold text-text transition-colors duration-[var(--transition-hover)] hover:border-muted hover:bg-elevated"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
