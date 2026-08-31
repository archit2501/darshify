import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import "../src/index.css";
import { PlayerProvider } from "../src/player/PlayerContext";
import { AppShell } from "../src/shell/AppShell";
import { ToastProvider } from "../src/shell/Toast";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <PlayerProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </PlayerProvider>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "The portfolio could not be loaded.";

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 text-center text-white">
      <div>
        <h1 className="mb-3 text-4xl font-black">Something went wrong</h1>
        <p className="mb-6 text-sub">{message}</p>
        <a
          href="/"
          className="rounded-full bg-accent px-6 py-3 font-bold text-black"
        >
          Back to Home
        </a>
      </div>
    </main>
  );
}
