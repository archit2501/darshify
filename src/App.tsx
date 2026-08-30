import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PlayerProvider } from "./player/PlayerContext";
import { ToastProvider } from "./shell/Toast";
import { AppShell } from "./shell/AppShell";

const Home = lazy(() =>
  import("./pages/Home").then((m) => ({ default: m.Home })),
);
const Search = lazy(() =>
  import("./pages/Search").then((m) => ({ default: m.Search })),
);
const Library = lazy(() =>
  import("./pages/Library").then((m) => ({ default: m.Library })),
);
const PlaylistPage = lazy(() =>
  import("./pages/PlaylistPage").then((m) => ({ default: m.PlaylistPage })),
);
const ArtistPage = lazy(() =>
  import("./pages/ArtistPage").then((m) => ({ default: m.ArtistPage })),
);
const LikedSongs = lazy(() =>
  import("./pages/LikedSongs").then((m) => ({ default: m.LikedSongs })),
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFound })),
);

export default function App() {
  return (
    <PlayerProvider>
      <ToastProvider>
        <Suspense
          fallback={
            <div className="h-screen grid place-items-center text-sub">
              Loading…
            </div>
          }
        >
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="/artist" element={<ArtistPage />} />
              <Route path="/liked" element={<LikedSongs />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </PlayerProvider>
  );
}
