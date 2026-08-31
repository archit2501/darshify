import { useEffect, useRef, type RefObject } from "react";
import { useLocation } from "react-router-dom";

export function RouteFocus({
  mainRef,
}: {
  mainRef: RefObject<HTMLElement | null>;
}) {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const main = mainRef.current;
    main?.scrollTo({ top: 0 });

    const heading = main?.querySelector<HTMLHeadingElement>("h1");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.dataset.routeHeading = "";
    heading.focus({ preventScroll: true });
  }, [mainRef, pathname]);

  return null;
}
