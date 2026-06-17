import { NavLink } from "react-router-dom";
import { HomeIcon, SearchIcon, LibraryIcon } from "../icons/icons";

const item = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-1 text-[10px] font-semibold ${isActive ? "text-white" : "text-sub"}`;

export function BottomNav() {
  return (
    <nav className="md:hidden flex items-center justify-around bg-bg border-t border-[#282828] py-2">
      <NavLink to="/" end className={item}><HomeIcon size={22} /> Home</NavLink>
      <NavLink to="/search" className={item}><SearchIcon size={22} /> Search</NavLink>
      <NavLink to="/library" className={item}><LibraryIcon size={22} /> Library</NavLink>
    </nav>
  );
}
