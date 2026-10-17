import { createContext } from "react";
import type { PlayerStore } from "./store";

export const PlayerStoreContext = createContext<PlayerStore | null>(null);
