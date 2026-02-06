// ---------------------------------------------------------------------------
// SourcesDrawer — collapsible "Show sources" panel
// ---------------------------------------------------------------------------

import { useState } from "react";
import type { Citation } from "@/api";
import { makePseudonym } from "@/utils/pseudonym";

interface SourcesDrawerProps {
  citations: Citation[];
}

export function SourcesDrawer({ citations }: SourcesDrawerProps) {
  const [open, setOpen] = useState(false);

  if (citations.length === 0) return null;

  return (
    <div className="sources-drawer">
      <button
        className="sources-drawer__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? "Hide sources" : `Show sources (${citations.length})`}
      </button>

      {open && (
        <ul className="sources-drawer__list">
          {citations.map((c, i) => (
            <li key={c.chunk_id} className="sources-drawer__item">
              <span className="sources-drawer__pseudo">
                {makePseudonym(c.chunk_id, i)}
              </span>
              <span className="sources-drawer__time">
                {c.ts_start} – {c.ts_end}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
