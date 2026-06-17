import { useNavigate } from "react-router-dom";

export function TopBar() {
  const nav = useNavigate();
  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 px-4 md:px-6 py-3 bg-bg/40 backdrop-blur-md">
      <button onClick={() => nav(-1)} aria-label="Back"
        className="grid place-items-center w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black">‹</button>
      <button onClick={() => nav(1)} aria-label="Forward"
        className="grid place-items-center w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black">›</button>
      <a href="/Darshil_Jain_Resume.pdf" download
        className="ml-auto bg-white text-black text-sm font-bold rounded-full px-4 py-1.5 hover:scale-105 transition-transform">
        Download CV
      </a>
      <span className="bg-black/60 rounded-full pl-1 pr-3 py-1 text-sm font-bold flex items-center gap-2">
        <span className="grid place-items-center w-6 h-6 rounded-full bg-accent text-black">D</span>Darshil
      </span>
    </div>
  );
}
