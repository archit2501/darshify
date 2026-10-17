import { Suspense, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router";
import {
  ArrowLeftIcon,
  CloseIcon,
  LibraryIcon,
  ListIcon,
  PinIcon,
  SearchIcon,
  SpeakerIcon,
} from "../icons/icons";
import { usePlayer } from "../player/hooks";
import {
  SORT_LABELS,
  visibleLibrary,
  type LibraryFilter,
  type LibrarySort,
} from "./library";
import { Cover } from "./Cover";
import { LibrarySortPopup } from "./popups/lazy";
import { useMenuButton } from "./popups/triggers";
import { ReleaseContextMenu } from "./ReleaseMenu";

const FILTERS: LibraryFilter[] = ["Playlists", "Albums", "Artists"];

const chip =
  "h-8 shrink-0 rounded-full bg-tint px-3 text-sm text-fg transition-colors hover:bg-tint-hover aria-pressed:bg-fg aria-pressed:text-black";
const iconButton =
  "grid size-8 place-items-center rounded-full text-subdued transition-[color,transform,background-color] hover:scale-104 hover:bg-tint hover:text-fg";

export function LibraryPanel({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [filter, setFilter] = useState<LibraryFilter | null>(null);
  const [sort, setSort] = useState<LibrarySort>("recents");
  const [compact, setCompact] = useState(false);
  const sortMenu = useMenuButton();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const playing = usePlayer((state) =>
    state.status === "playing" ? state.context.id : null,
  );
  const items = useMemo(
    () => visibleLibrary(sort, filter, query),
    [sort, filter, query],
  );

  return (
    <nav
      aria-label="Your Library"
      className="flex h-full min-h-0 flex-col rounded-panel bg-surface"
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={
            collapsed ? "Expand Your Library" : "Collapse Your Library"
          }
          className="flex min-w-0 items-center gap-3 rounded-full py-1 pr-2 font-bold text-subdued transition-colors hover:text-fg"
        >
          <LibraryIcon />
          {collapsed ? null : <span className="truncate">Your Library</span>}
        </button>
        {collapsed ? null : (
          <NavLink
            to="/library"
            aria-label="Show Your Library page"
            className={`${iconButton} ml-auto`}
          >
            <ArrowLeftIcon size={18} className="rotate-180" />
          </NavLink>
        )}
      </div>

      {collapsed ? null : (
        <>
          <div
            role="group"
            aria-label="Filter Your Library"
            className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2"
          >
            {filter ? (
              <button
                type="button"
                aria-label="Clear filter"
                onClick={() => setFilter(null)}
                className={`${chip} grid w-8 place-items-center px-0`}
              >
                <CloseIcon size={16} />
              </button>
            ) : null}
            {FILTERS.filter(
              (option) => filter === null || filter === option,
            ).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => setFilter(filter === option ? null : option)}
                className={chip}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 px-2 pb-1">
            {searching ? (
              <div className="flex h-8 flex-1 items-center gap-2 rounded-row bg-surface-2 px-2">
                <SearchIcon size={16} className="shrink-0 text-subdued" />
                <label htmlFor="library-search" className="sr-only">
                  Search in Your Library
                </label>
                <input
                  ref={searchInput}
                  id="library-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setQuery("");
                      setSearching(false);
                    }
                  }}
                  onBlur={() => {
                    if (!query) setSearching(false);
                  }}
                  placeholder="Search in Your Library"
                  className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-subdued [&::-webkit-search-cancel-button]:hidden"
                />
              </div>
            ) : (
              <button
                type="button"
                aria-label="Search in Your Library"
                onClick={() => {
                  setSearching(true);
                  requestAnimationFrame(() => searchInput.current?.focus());
                }}
                className={iconButton}
              >
                <SearchIcon size={16} />
              </button>
            )}
            <button
              {...sortMenu.buttonProps}
              className="ml-auto flex h-8 items-center gap-2 rounded-full px-2 text-sm text-subdued transition-colors hover:text-fg"
            >
              {SORT_LABELS[sort]}
              <ListIcon size={16} />
            </button>
            {sortMenu.mounted ? (
              <Suspense fallback={null}>
                <LibrarySortPopup
                  open={sortMenu.open}
                  onOpenChange={sortMenu.setOpen}
                  anchor={sortMenu.ref}
                  finalFocus={sortMenu.ref}
                  highlight={sortMenu.highlight}
                  sort={sort}
                  onSortChange={setSort}
                  compact={compact}
                  onCompactChange={setCompact}
                />
              </Suspense>
            ) : null}
          </div>
        </>
      )}

      <ul className="scroll-area min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {items.map((item) => {
          const isPlaying = playing === item.contextId;
          const releaseId = item.contextId.startsWith("release:")
            ? item.contextId.slice("release:".length)
            : null;
          const row = (
            <NavLink
              to={item.href}
              title={collapsed ? item.title : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-art p-2 transition-colors hover:bg-tint ${isActive ? "bg-tint-hover hover:bg-tint-strong" : ""} ${collapsed ? "justify-center" : ""}`
              }
            >
              {compact && !collapsed ? null : (
                <Cover
                  art={item.art}
                  size="sm"
                  round={item.type === "Artist"}
                />
              )}
              <span className={collapsed ? "sr-only" : "min-w-0 flex-1"}>
                <span
                  className={`block truncate ${isPlaying ? "text-green" : "text-fg"}`}
                >
                  {item.title}
                </span>
                <span className="flex items-center gap-1 truncate text-sm text-subdued">
                  {item.pinned ? (
                    <PinIcon size={12} className="shrink-0 text-green" />
                  ) : null}
                  {item.subtitle}
                </span>
              </span>
              {isPlaying && !collapsed ? (
                <SpeakerIcon
                  size={16}
                  title="Now playing"
                  className="shrink-0 text-green"
                />
              ) : null}
            </NavLink>
          );
          return releaseId ? (
            <ReleaseContextMenu
              key={item.id}
              releaseId={releaseId}
              render={<li />}
            >
              {row}
            </ReleaseContextMenu>
          ) : (
            <li key={item.id}>{row}</li>
          );
        })}
        {items.length === 0 ? (
          <li className="px-2 py-6 text-center text-sm text-subdued">
            Nothing in Your Library matches “{query}”.
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
