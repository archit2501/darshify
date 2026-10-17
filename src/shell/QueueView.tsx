import { Link } from "react-router";
import { CloseIcon } from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import { trackById } from "../player/tracks";
import { Cover } from "./Cover";
import { Equalizer } from "./Equalizer";
import { IconButton } from "./IconButton";
import { SongContextMenu, SongMenu } from "./SongMenu";

/** Row "…" buttons appear on hover or focus, and always on touch screens. */
const revealOnHover =
  "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 data-popup-open:opacity-100 [@media(hover:none)]:opacity-100";

const shallowEqual = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * The Queue view: what is playing, the songs the listener queued, then the
 * rest of the list it is playing from. Every row plays on click.
 */
export function QueueView() {
  const currentId = usePlayer((state) => state.currentId);
  const playing = usePlayer((state) => state.status === "playing");
  const queue = usePlayer((state) => state.queue, shallowEqual);
  const context = usePlayer((state) => state.context);
  const contextTitle = context.title;
  const upcoming = usePlayer(
    (state) =>
      state.order
        .slice(state.position + 1)
        .map((index) => state.context.trackIds[index]!),
    shallowEqual,
  );
  const position = usePlayer((state) => state.position);
  const { closePanel, playQueued, playAt, removeFromQueue } =
    usePlayerActions();
  const now = trackById(currentId);

  return (
    <aside
      aria-label="Queue"
      className="scroll-area flex h-full min-h-0 flex-col gap-6 overflow-y-auto rounded-panel bg-surface p-4"
    >
      <header className="flex items-center justify-between">
        <h2 className="font-bold">Queue</h2>
        <IconButton label="Close queue" onClick={closePanel}>
          <CloseIcon size={16} />
        </IconButton>
      </header>

      {now ? (
        <section aria-labelledby="queue-now">
          <h3 id="queue-now" className="mb-2 font-bold">
            Now playing
          </h3>
          <SongContextMenu
            songId={now.id}
            context={context}
            render={
              <Link
                to={now.href}
                className="flex items-center gap-3 rounded-row p-2 hover:bg-tint"
              />
            }
          >
            <Cover art={now.art} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-green">{now.title}</span>
              <span className="block truncate text-sm text-subdued">
                {now.subtitle}
              </span>
            </span>
            {playing ? <Equalizer /> : null}
          </SongContextMenu>
        </section>
      ) : null}

      {queue.length > 0 ? (
        <section aria-labelledby="queue-next">
          <h3 id="queue-next" className="mb-2 font-bold">
            Next in queue
          </h3>
          <ol>
            {queue.map((id, index) => {
              const track = trackById(id)!;
              return (
                <SongContextMenu
                  key={`${id}-${index}`}
                  songId={id}
                  render={
                    <li className="group flex items-center gap-1 rounded-row pr-1 hover:bg-tint" />
                  }
                >
                  <button
                    type="button"
                    onClick={() => playQueued(index)}
                    className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left"
                  >
                    <Cover art={track.art} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate">{track.title}</span>
                      <span className="block truncate text-sm text-subdued">
                        {track.subtitle}
                      </span>
                    </span>
                  </button>
                  <SongMenu songId={id} className={revealOnHover} />
                  <IconButton
                    label={`Remove ${track.title} from queue`}
                    onClick={() => removeFromQueue(index)}
                  >
                    <CloseIcon size={14} />
                  </IconButton>
                </SongContextMenu>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="queue-from">
        <h3 id="queue-from" className="mb-2 font-bold">
          Next from: {contextTitle}
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-subdued">Nothing else in this list.</p>
        ) : (
          <ol>
            {upcoming.map((id, offset) => {
              const track = trackById(id)!;
              return (
                <SongContextMenu
                  key={id}
                  songId={id}
                  context={context}
                  render={
                    <li className="group flex items-center gap-1 rounded-row pr-1 hover:bg-tint" />
                  }
                >
                  <button
                    type="button"
                    onClick={() => playAt(position + 1 + offset)}
                    className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left"
                  >
                    <Cover art={track.art} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate">{track.title}</span>
                      <span className="block truncate text-sm text-subdued">
                        {track.subtitle}
                      </span>
                    </span>
                  </button>
                  <SongMenu
                    songId={id}
                    context={context}
                    className={revealOnHover}
                  />
                </SongContextMenu>
              );
            })}
          </ol>
        )}
      </section>
    </aside>
  );
}
