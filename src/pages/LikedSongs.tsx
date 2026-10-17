import { collectionById, LIKED_RELEASE_ID } from "../content/selectors";
import { ReleaseView } from "./ReleaseView";

const achievements = (() => {
  const release = collectionById(LIKED_RELEASE_ID);
  if (!release) throw new Error("Missing achievements collection");
  return release;
})();

/** /liked: the awards, laid out like the app's Liked Songs. */
export function LikedSongs() {
  return <ReleaseView release={achievements} title="Selected achievements" />;
}
