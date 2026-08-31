import { NavLink, useLocation } from "react-router-dom";
import { playlists, AVATAR, LIKED_COVER } from "../data/library";
import { HomeIcon, SearchIcon, LibraryIcon } from "../icons/icons";
import { Art } from "./Art";
import { ContactActions } from "../components/ContactActions";
import { portfolio } from "../content/portfolio";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `interactive-target flex items-center gap-4 font-bold ${isActive ? "text-white" : "text-sub hover:text-white"}`;

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary navigation"
      className="hidden w-56 shrink-0 flex-col gap-2 p-2 text-sm md:flex"
    >
      {/* brand + top nav */}
      <div className="bg-panel rounded-lg p-4">
        <div className="flex items-center gap-2 font-black text-xl mb-5">
          <span className="grid place-items-center w-7 h-7 rounded-full bg-accent text-black">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
          </span>
          DARSHIFY
        </div>
        <div className="flex flex-col gap-4">
          <NavLink to="/" end className={navCls}>
            <HomeIcon size={22} /> Overview
          </NavLink>
          <NavLink to="/search" className={navCls}>
            <SearchIcon size={22} /> Search
          </NavLink>
        </div>
      </div>

      {/* library */}
      <div className="bg-panel rounded-lg p-4 flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center gap-3 text-sub font-bold mb-4">
          <LibraryIcon size={22} /> Portfolio
        </div>
        <div className="flex flex-col gap-1">
          <NavLink
            to="/artist"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md p-2 ${isActive ? "bg-card-hi" : "hover:bg-card"}`
            }
          >
            <Art
              src={AVATAR}
              gradient="linear-gradient(135deg,#1ed760,#0a5)"
              className="w-11 h-11 rounded-full shrink-0"
            />
            <span>
              <span className="block font-semibold text-white">
                Candidate profile
              </span>
              <span className="text-sub text-xs">Profile</span>
            </span>
          </NavLink>
          <NavLink
            to="/liked"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md p-2 ${isActive ? "bg-card-hi" : "hover:bg-card"}`
            }
          >
            <Art
              src={LIKED_COVER}
              gradient="linear-gradient(135deg,#4a00e0,#b3b3ff)"
              className="w-11 h-11 rounded shrink-0"
            />
            <span>
              <span className="block font-semibold text-white">
                Achievements
              </span>
              <span className="text-sub text-xs">Recognition</span>
            </span>
          </NavLink>
          {playlists.map((pl) => (
            <NavLink
              key={pl.id}
              to={`/playlist/${pl.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md p-2 ${isActive ? "bg-card-hi" : "hover:bg-card"}`
              }
            >
              <Art
                src={pl.cover}
                gradient={pl.gradient}
                className="w-11 h-11 rounded shrink-0"
              />
              <span className="min-w-0">
                <span className="block font-semibold text-white truncate">
                  {pl.title}
                </span>
                <span className="text-sub text-xs">Portfolio collection</span>
              </span>
            </NavLink>
          ))}
        </div>
        {pathname !== "/" && (
          <div className="mt-4 border-t border-line pt-4">
            <ContactActions candidate={portfolio.candidate} placement="rail" />
          </div>
        )}
      </div>
    </nav>
  );
}
