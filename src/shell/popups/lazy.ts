import { lazy } from "react";

// Base UI (menus, dialogs, the phone player's drawer, tooltips) loads the
// first time it's wanted, so it stays out of the JavaScript every page needs
// up front. The buttons that open these popups are plain buttons rendered on
// the server; only what they open is lazy.

const menus = () => import("./Menus");
const phonePlayer = () => import("./PhonePlayer");
const shortcuts = () => import("../ShortcutsDialog");

export const SongMenuPopup = lazy(() =>
  menus().then((module) => ({ default: module.SongMenuPopup })),
);
export const ReleaseMenuPopup = lazy(() =>
  menus().then((module) => ({ default: module.ReleaseMenuPopup })),
);
export const AccountMenuPopup = lazy(() =>
  menus().then((module) => ({ default: module.AccountMenuPopup })),
);
export const LibrarySortPopup = lazy(() =>
  menus().then((module) => ({ default: module.LibrarySortPopup })),
);
export const PhonePlayer = lazy(phonePlayer);
export const ShortcutsDialog = lazy(() =>
  shortcuts().then((module) => ({ default: module.ShortcutsDialog })),
);
export const TooltipLayer = lazy(() => import("./TooltipLayer"));

/** Starts loading the menus on hover, focus or press, before the click. */
export const preloadMenus = () => {
  void menus();
};

/** Starts loading the phone player as the mini player is pressed. */
export const preloadPhonePlayer = () => {
  void phonePlayer();
};
