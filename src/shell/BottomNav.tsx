import { NavLink } from "react-router-dom";
import { HomeIcon, SearchIcon, LibraryIcon } from "../icons/icons";

const item = ({ isActive }: { isActive: boolean }) =>
  `interactive-target flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold ${isActive ? "text-white" : "text-sub"}`;

export function BottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="flex items-center justify-around border-t border-line bg-bg py-2 md:hidden"
    >
      <NavLink to="/" end className={item}>
        <HomeIcon size={22} /> Overview
      </NavLink>
      <NavLink to="/search" className={item}>
        <SearchIcon size={22} /> Search
      </NavLink>
      <NavLink to="/library" className={item}>
        <LibraryIcon size={22} /> Portfolio
      </NavLink>
    </nav>
  );
}
