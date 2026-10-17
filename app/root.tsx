import { useEffect, type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  type LinksFunction,
} from "react-router";
import "../src/index.css";
import figtreeLatin from "@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url";
import { PlayerProvider } from "../src/player/PlayerProvider";
import { AppShell } from "../src/shell/AppShell";
import { ToastProvider } from "../src/shell/Toast";
import {
  redactAnalyticsEvent,
  shouldEnableAnalytics,
} from "../src/analytics/outcomes";

export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: figtreeLatin,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  { rel: "icon", href: "/favicon.ico", sizes: "32x32 48x48" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.webmanifest" },
];

function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    return () => {
      delete document.documentElement.dataset.hydrated;
    };
  }, []);
  return null;
}

function ProductionAnalytics() {
  if (
    typeof window === "undefined" ||
    !shouldEnableAnalytics(window.location.hostname)
  ) {
    return null;
  }
  return (
    <Analytics
      mode="production"
      debug={false}
      beforeSend={redactAnalyticsEvent}
    />
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
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
    <>
      <ProductionAnalytics />
      <PlayerProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </PlayerProvider>
      <HydrationMarker />
    </>
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
