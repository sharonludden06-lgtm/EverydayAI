"use client";
import { useState, type ReactNode } from "react";

/**
 * The Resources page filter buttons. The cards themselves are built on the page (app/resources/page.tsx);
 * this only chooses which ones to show. A filter with no guides yet shows `empty` instead of a blank grid.
 */
export function ResourceFilter({
  filters,
  cards,
  empty,
}: {
  filters: string[];
  cards: { category: string; card: ReactNode }[];
  empty: ReactNode;
}) {
  const all = "Browse all";
  const [selected, setSelected] = useState(all);
  const shown = selected === all ? cards : cards.filter((c) => c.category === selected);

  return (
    <>
      <div className="filter-row" role="group" aria-label="Filter guides">
        {[all, ...filters].map((f) => (
          <button key={f} type="button" aria-pressed={selected === f} onClick={() => setSelected(f)}>
            {f}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {selected === all ? `Showing all ${cards.length} guides` : shown.length ? `${selected}: ${shown.length} ${shown.length === 1 ? "guide" : "guides"}` : `${selected}: no guides yet`}
      </p>
      {shown.length ? <div className="resource-grid">{shown.map((c) => c.card)}</div> : empty}
    </>
  );
}
