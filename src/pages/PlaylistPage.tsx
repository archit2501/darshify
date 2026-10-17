import { useParams } from "react-router";
import { collectionById } from "../content/selectors";
import { NotFound } from "./NotFound";
import { ReleaseView } from "./ReleaseView";

/** /playlist/:id: one of Darshil's playlists, EPs, albums or singles. */
export function PlaylistPage() {
  const { id = "" } = useParams();
  const release = collectionById(id);
  return release ? <ReleaseView release={release} /> : <NotFound />;
}
