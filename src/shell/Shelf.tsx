import type { ReactNode } from "react";

export function Shelf({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-2xl font-bold hover:underline cursor-default">{title}</h2>
        <span className="text-sub text-xs font-bold tracking-wide hover:underline cursor-pointer">Show all</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">{children}</div>
    </section>
  );
}
