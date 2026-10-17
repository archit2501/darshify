/** Long titles step down so they stay on one or two lines, as in the app. */
export function titleSizeClass(title: string): string {
  if (title.length <= 14) return "text-display";
  if (title.length <= 26)
    return "text-[clamp(1.75rem,0.5rem+4.5cqi,4.5rem)] leading-[1.02] font-black tracking-[-0.035em]";
  return "text-[clamp(1.5rem,0.5rem+3cqi,3rem)] leading-[1.05] font-black tracking-[-0.03em]";
}
