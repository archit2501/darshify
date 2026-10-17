import { Drawer } from "@base-ui/react/drawer";
import type { RefObject } from "react";
import { FullScreenPlayer } from "../FullScreenPlayer";

/**
 * The phone's full-screen player in its drawer, loaded the first time the
 * mini player is pressed (see ./lazy.ts). Focus goes back to the mini
 * player when it closes.
 */
export default function PhonePlayer({
  open,
  onOpenChange,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <FullScreenPlayer
        onClose={() => onOpenChange(false)}
        finalFocus={returnFocus}
      />
    </Drawer.Root>
  );
}
