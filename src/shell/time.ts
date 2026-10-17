/** "1:05" for 65 000 ms. */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** "1 minute 5 seconds", for screen readers. */
export function spokenTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const parts = [];
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
  return parts.join(" ");
}
