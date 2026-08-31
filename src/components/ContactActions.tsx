import type { CandidateProfile } from "../content/types";
import { DownloadIcon, LinkedInIcon, MailIcon } from "../icons/icons";

export type ContactAction = "cv" | "email" | "linkedin";
export type ContactActionsPlacement = "hero" | "rail" | "topbar";

interface ContactActionsProps {
  candidate: CandidateProfile;
  placement: ContactActionsPlacement;
  onAction?: (
    action: ContactAction,
    placement: ContactActionsPlacement,
  ) => void;
}

const layoutByPlacement: Record<ContactActionsPlacement, string> = {
  hero: "flex flex-wrap gap-3",
  rail: "grid grid-cols-1 gap-2",
  topbar: "flex items-center gap-1",
};

const baseActionClass =
  "interactive-target inline-flex items-center justify-center gap-2 rounded-full px-3 text-sm font-bold transition-transform duration-[var(--transition-hover-fast)] motion-safe:hover:scale-[1.02]";

export function ContactActions({
  candidate,
  placement,
  onAction,
}: ContactActionsProps) {
  const labelClass = placement === "topbar" ? "sr-only" : undefined;
  const track = (action: ContactAction) => () => onAction?.(action, placement);

  return (
    <div
      role="group"
      aria-label={`Contact ${candidate.name}`}
      data-placement={placement}
      className={layoutByPlacement[placement]}
    >
      <a
        href={candidate.resumeUrl}
        download
        onClick={track("cv")}
        data-motion-transform
        className={`${baseActionClass} bg-signal text-black`}
      >
        <DownloadIcon size={18} />
        <span className={labelClass}>Download CV</span>
      </a>
      <a
        href={`mailto:${candidate.email}`}
        onClick={track("email")}
        data-motion-transform
        className={`${baseActionClass} border border-line text-white hover:border-white`}
      >
        <MailIcon size={18} />
        <span className={labelClass}>Email</span>
      </a>
      <a
        href={candidate.linkedInUrl}
        target="_blank"
        rel="noreferrer noopener"
        onClick={track("linkedin")}
        data-motion-transform
        className={`${baseActionClass} border border-line text-white hover:border-white`}
      >
        <LinkedInIcon size={18} />
        <span className={labelClass}>LinkedIn</span>
      </a>
    </div>
  );
}
