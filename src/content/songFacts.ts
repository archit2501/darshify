import { proofById } from "./selectors";
import type { CalendarDate, CaseStudy } from "./types";

// Plain facts for track tables and headers, all read from the résumé data.

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const parts = (date: CalendarDate) => {
  const [year, month] = date.split("-").map(Number);
  return { year: year!, month };
};

/** "Jan 2026", or "2024" when only the year is known. */
export function formatCalendarDate(date: CalendarDate): string {
  const { year, month } = parts(date);
  return month ? `${MONTHS[month - 1]} ${year}` : String(year);
}

/** When the song "came out": the month (or year) it started. */
export const startLabel = (song: CaseStudy) =>
  song.start ? formatCalendarDate(song.start) : undefined;

/**
 * How long it ran, counting both ends: Jan–Feb 2026 is "2 mo"; 2024–2027 is
 * "3 yr". Undefined when the résumé gives a single date.
 */
export function lengthLabel(song: CaseStudy): string | undefined {
  if (!song.start || !song.end) return undefined;
  const start = parts(song.start);
  const end = parts(song.end);
  if (start.month && end.month) {
    const months = (end.year - start.year) * 12 + (end.month - start.month) + 1;
    return months >= 12 && months % 12 === 0
      ? `${months / 12} yr`
      : `${months} mo`;
  }
  const years = end.year - start.year;
  return years > 0 ? `${years} yr` : undefined;
}

/** The years a list spans, e.g. "2024–2026". */
export function yearSpan(songs: readonly CaseStudy[]): string | undefined {
  const years = songs
    .flatMap((song) => [song.start, song.end])
    .filter((date): date is CalendarDate => Boolean(date))
    .map((date) => parts(date).year);
  if (years.length === 0) return undefined;
  const first = Math.min(...years);
  const last = Math.max(...years);
  return first === last ? String(first) : `${first}–${last}`;
}

/** What a song is known for, in the column the app uses for play counts. */
export function impactLabel(song: CaseStudy): string | undefined {
  const proof = song.featuredProofId
    ? proofById(song.featuredProofId)
    : undefined;
  return proof ? `${proof.display} ${proof.label}` : undefined;
}
