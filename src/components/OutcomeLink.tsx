import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  trackOutcome,
  type OutcomeEvent,
  type OutcomeProperties,
} from "../analytics/outcomes";
import { routeIdForPathname } from "../seo/meta";

type CommonProps = {
  children: ReactNode;
  outcome: OutcomeEvent;
  properties: Omit<OutcomeProperties, "routeId"> & {
    routeId?: OutcomeProperties["routeId"];
  };
};

type NativeOutcomeLinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    to?: never;
  };

type RouterOutcomeLinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    to: string;
    href?: never;
  };

export type OutcomeLinkProps = NativeOutcomeLinkProps | RouterOutcomeLinkProps;

export function OutcomeLink(props: OutcomeLinkProps) {
  const { children, outcome, properties, onClick, ...linkProps } = props;
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const pathname =
      typeof window === "undefined" ? undefined : window.location.pathname;
    const routeId =
      properties.routeId ??
      (pathname ? routeIdForPathname(pathname) : undefined);
    try {
      trackOutcome(outcome, {
        ...(routeId ? { routeId } : {}),
        ...properties,
      });
    } catch {
      // Analytics must never prevent navigation or conversion.
    }
    onClick?.(event);
  };

  if ("to" in linkProps && linkProps.to !== undefined) {
    return (
      <Link {...linkProps} to={linkProps.to} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <a {...linkProps} href={linkProps.href} onClick={handleClick}>
      {children}
    </a>
  );
}
