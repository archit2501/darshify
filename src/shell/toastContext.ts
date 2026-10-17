import { createContext, useContext } from "react";

/** Shows a short notice above the player, such as "Added to queue". */
export type Notify = (text: string) => void;

export const ToastContext = createContext<Notify>(() => {});

export const useToast = () => useContext(ToastContext);
