import { NavLink } from "react-router-dom";
import { playlists } from "../data/library";
import { HomeIcon, SearchIcon, LibraryIcon } from "../icons/icons";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-4 font-bold ${isActive ? "text-white" : "text-sub hover:text-white"}`;

export function Sidebar() {
  return (
    <nav className="hidden md:flex flex-col gap-2 w-[260px] p-2 text-sm">
      {/* brand + top nav */}
      <div className="bg-panel rounded-lg p-4">
        <div className="flex items-center gap-2 font-black text-xl mb-5">
          <span className="grid place-items-center w-7 h-7 rounded-full bg-accent text-black">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>
          </span>
          DARSHIFY
        </div>
        <div className="flex flex-col gap-4">
          <NavLink to="/" end className={navCls}><HomeIcon size={22} /> Home</NavLink>
          <NavLink to="/search" className={navCls}><SearchIcon size={22} /> Search</NavLink>
        </div>
      </div>

      {/* library */}
      <div className="bg-panel rounded-lg p-4 flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center gap-3 text-sub font-bold mb-4">
          <LibraryIcon size={22} /> Your Library
        </div>
        <div className="flex flex-col gap-1">
          <NavLink to="/artist" className={({ isActive }) => `flex items-center gap-3 rounded-md p-2 ${isActive ? "bg-card-hi" : "hover:bg-card"}`}>
            <span className="w-11 h-11 rounded-full shrink-0" style={{ background: "linear-gradient(135deg,#1ed760,#0a5)" }} />
            <span><span className="block font-semibold text-white">This Is Darshil</span><span className="text-sub text-xs">Artist</span></span>
          </NavLink>
          <NavLink to="/liked" className={({ isActive }) => `flex items-center gap-3 rounded-md p-2 ${isActive ? "bg-card-hi" : "hover:bg-card"}`}>
            <span className="w-11 h-11 rounded grid place-items-center shrink-0" style={{ background: "linear-gradient(135deg,#4a00e0,#b3b3ff)" }}>♥</span>
            <span><span className="block font-semibold text-white">Liked Songs</span><span className="text-sub text-xs">Playlist · Achievements</span></span>
          </NavLink>
          {playlists.map((pl) => (
            <NavLink key={pl.id} to={`/playlist/${pl.id}`} className={({ isActive }) => `flex items-center gap-3 rounded-md p-2 ${isActive ? "bg-card-hi" : "hover:bg-card"}`}>
              <span className="w-11 h-11 rounded shrink-0" style={{ background: pl.gradient }} />
              <span className="min-w-0"><span className="block font-semibold text-white truncate">{pl.title}</span><span className="text-sub text-xs">{pl.kind} · Darshil Jain</span></span>
            </NavLink>
          ))}
        </div>
        <a href="/Darshil_Jain_Resume.pdf" download
          className="mt-4 block text-center border border-sub/40 rounded-full py-2 font-bold text-white hover:border-white hover:scale-[1.02] transition-transform">
          ↓ Download CV
        </a>
      </div>
    </nav>
  );
}
