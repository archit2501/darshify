import { Link } from "react-router";
import { portfolio } from "../content/portfolio";
import { SITE } from "../seo/site";

const columns = [
  {
    heading: "Darshil Jain",
    links: [
      { label: "Profile", to: "/artist" },
      { label: "This Is Darshil Jain", to: "/playlist/this-is-darshil-jain" },
      { label: "Rewind", to: "/rewind" },
    ],
  },
  {
    heading: "Work",
    links: [
      { label: "Experience", to: "/playlist/experience" },
      { label: "Projects", to: "/playlist/projects" },
      { label: "Leadership", to: "/playlist/leadership" },
    ],
  },
  {
    heading: "Recognition",
    links: [
      { label: "Achievements", to: "/liked" },
      { label: "Certifications", to: "/playlist/certs" },
      { label: "Education", to: "/playlist/education" },
    ],
  },
];

/**
 * Closes every page the way the desktop app does: a few link columns, the
 * contact routes, the liner note about where the numbers come from, and the
 * non-affiliation note.
 */
export function PageFooter() {
  const { candidate } = portfolio;
  return (
    <footer className="mt-16 border-t border-divider px-(--content-x) pt-10 pb-12 text-sm text-subdued">
      <nav
        aria-label="Footer"
        className="grid grid-cols-2 gap-8 sm:grid-cols-4"
      >
        {columns.map((column) => (
          <div key={column.heading}>
            <h2 className="mb-2 font-bold text-fg">{column.heading}</h2>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-fg hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="mb-2 font-bold text-fg">Contact</h2>
          <ul className="space-y-2">
            <li>
              <a
                href={`mailto:${candidate.email}`}
                className="hover:text-fg hover:underline"
              >
                Email
              </a>
            </li>
            <li>
              <a
                href={candidate.linkedInUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="hover:text-fg hover:underline"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href={candidate.resumeUrl}
                download
                className="hover:text-fg hover:underline"
              >
                Résumé (PDF)
              </a>
            </li>
          </ul>
        </div>
      </nav>
      <div className="mt-10 space-y-2 border-t border-divider pt-6 text-xs leading-relaxed">
        <p>
          Liner notes: every figure on this site comes from{" "}
          <a href={candidate.resumeUrl} className="underline hover:text-fg">
            Darshil Jain&rsquo;s résumé
          </a>
          .
        </p>
        <p>{SITE.nonAffiliationNote}</p>
        <p>© {SITE.copyrightYear} Darshil Jain</p>
      </div>
    </footer>
  );
}
