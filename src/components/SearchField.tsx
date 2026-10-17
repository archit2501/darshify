import { CloseIcon, SearchIcon } from "../icons/icons";

/**
 * The page's search box, styled like the app's: a white pill with the
 * magnifier, a visible label above it, and Clear once there's a query.
 */
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
        className="mb-1 block text-sm font-bold text-fg"
      >
        Search experience, skills, and evidence
      </label>
      <p id="portfolio-search-hint" className="mb-3 text-sm text-subdued">
        Organizations, skills, actions, outcomes, takeaways or sources.
      </p>
      <div className="relative flex items-center gap-2">
        <SearchIcon
          size={22}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-black/70"
        />
        <input
          id="portfolio-search"
          name="portfolio-search"
          type="search"
          autoComplete="off"
          aria-describedby="portfolio-search-hint"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="What do you want to explore?"
          className="h-12 w-full rounded-full bg-fg pr-4 pl-12 font-semibold text-black outline-none placeholder:font-normal placeholder:text-black/55 focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-tint px-4 font-bold transition-colors hover:bg-tint-strong"
          >
            <CloseIcon size={16} />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
