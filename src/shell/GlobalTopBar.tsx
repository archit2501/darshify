import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from "react-router";
import { portfolio } from "../content/portfolio";
import {
  BrowseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DarshifyMark,
  HomeFilledIcon,
  MailIcon,
  HomeIcon,
  SearchIcon,
} from "../icons/icons";
import { AccountMenu } from "./AccountMenu";

const roundButton =
  "grid size-12 shrink-0 place-items-center rounded-full bg-surface-hi text-subdued transition-[transform,color] duration-(--dur-hover) motion-safe:hover:scale-104 hover:text-fg";
const historyButton =
  "grid size-8 place-items-center rounded-full bg-app/70 text-fg transition-opacity disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Whether Back and Forward lead anywhere. The browser router stamps each
 * history entry with its index; the furthest index seen tells us whether a
 * Forward entry exists. Where no index is available, both stay enabled.
 */
function useHistoryAvailability() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const furthest = useRef(0);
  const [available, setAvailable] = useState({ back: true, forward: true });

  useEffect(() => {
    const state = window.history.state as { idx?: unknown } | null;
    if (typeof state?.idx !== "number") return;
    const index = state.idx;
    if (navigationType !== "POP" || index > furthest.current) {
      furthest.current = index;
    }
    setAvailable({ back: index > 0, forward: index < furthest.current });
  }, [location.key, navigationType]);

  return available;
}

/**
 * The desktop app's global top bar: brand, history, Home, a centred search
 * pill and the account area. Search is a real GET form, so it works without
 * JavaScript and every query has a shareable URL (/search?q=…).
 */
export function GlobalTopBar({
  onShortcuts,
}: {
  /** Opens the keyboard shortcuts sheet from the avatar menu. */
  onShortcuts?: () => void;
} = {}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const onSearchPage = pathname.replace(/\/+$/, "") === "/search";
  const urlQuery = onSearchPage ? (params.get("q") ?? "") : "";
  const [query, setQuery] = useState(urlQuery);
  // Follow the URL when it changes underneath the field (Back, a link, leaving
  // Search) without fighting the listener's own typing.
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (urlQuery !== query.trim()) setQuery(urlQuery);
  }
  const input = useRef<HTMLInputElement>(null);
  const history = useHistoryAvailability();

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search", {
      replace: onSearchPage,
    });
  };

  const onChange = (value: string) => {
    setQuery(value);
    if (onSearchPage) {
      const q = value.trim();
      navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search", {
        replace: true,
        preventScrollReset: true,
      });
    }
  };

  return (
    <header className="flex h-(--topbar-h) items-center gap-2 px-2">
      <Link
        to="/"
        aria-label="Darshify home"
        className="mr-2 hidden shrink-0 rounded-full lg:block"
      >
        <DarshifyMark size={32} />
      </Link>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Go back"
          disabled={!history.back}
          onClick={() => navigate(-1)}
          className={historyButton}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <button
          type="button"
          aria-label="Go forward"
          disabled={!history.forward}
          onClick={() => navigate(1)}
          className={historyButton}
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[34rem] items-center gap-2 px-2">
        <NavLink
          to="/"
          end
          aria-label="Home"
          className={({ isActive }) =>
            `${roundButton} ${isActive ? "text-fg" : ""}`
          }
        >
          {({ isActive }) => (isActive ? <HomeFilledIcon /> : <HomeIcon />)}
        </NavLink>
        <form
          role="search"
          action="/search"
          method="get"
          onSubmit={submit}
          className="group relative flex-1"
        >
          <label htmlFor="global-search" className="sr-only">
            Search Darshil&rsquo;s roles, projects and skills
          </label>
          <SearchIcon
            size={24}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subdued transition-colors group-focus-within:text-fg group-hover:text-fg"
          />
          <input
            ref={input}
            id="global-search"
            name="q"
            type="search"
            inputMode="search"
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(event) => onChange(event.target.value)}
            placeholder="What do you want to explore?"
            className="h-12 w-full rounded-full bg-surface-hi pr-24 pl-12 text-base text-fg ring-white/10 transition-[background-color,box-shadow] duration-(--dur-hover) placeholder:text-subdued hover:bg-surface-2 hover:ring-1 focus:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                onChange("");
                input.current?.focus();
              }}
              className="absolute top-1/2 right-12 grid size-8 -translate-y-1/2 place-items-center rounded-full text-subdued hover:text-fg"
            >
              <CloseIcon size={18} />
            </button>
          ) : null}
          <span
            aria-hidden="true"
            className="absolute top-1/2 right-11 h-6 w-px -translate-y-1/2 bg-icon-off/60"
          />
          <Link
            to="/search"
            aria-label="Browse all"
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-subdued hover:text-fg"
          >
            <BrowseIcon size={20} />
          </Link>
        </form>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href={portfolio.candidate.resumeUrl}
          download
          className="hidden h-8 items-center gap-2 rounded-full bg-fg px-4 text-sm font-bold text-black transition-transform duration-(--dur-hover) motion-safe:hover:scale-104 xl:flex"
        >
          Download CV
        </a>
        <a
          href={`mailto:${portfolio.candidate.email}`}
          className="hidden h-8 items-center gap-2 rounded-full px-2 text-sm font-bold text-subdued transition-[transform,color] motion-safe:hover:scale-104 hover:text-fg xl:flex"
        >
          <MailIcon size={16} />
          Email Darshil
        </a>
        <AccountMenu onShortcuts={onShortcuts} />
      </div>
    </header>
  );
}
