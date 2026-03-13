// ---------------------------------------------------------------------------
// NewsPanel — placeholder student news button (server integration pending)
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";

export function NewsPanel() {
  const [open, setOpen] = useState(false);
  const [renderPopup, setRenderPopup] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setRenderPopup(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setRenderPopup(false);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;

      if (!typing && (e.key === "n" || e.key === "N")) {
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    function handleOutsideClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function closeFromAppEvent() {
      setOpen(false);
    }

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("app:close-overlays", closeFromAppEvent as EventListener);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("app:close-overlays", closeFromAppEvent as EventListener);
    };
  }, []);

  return (
    <div className="news" ref={rootRef}>
      <button
        className="news__trigger"
        type="button"
        aria-label="Student news"
        aria-expanded={open}
        title="Student News (coming soon)"
        onClick={() => setOpen((v) => !v)}
      >
        🎓
        <span className="news__badge">new</span>
      </button>

      {renderPopup && (
        <div className={`news__popup ${open ? "news__popup--open" : ""}`} role="dialog" aria-label="Student News">
          <p className="news__popup-title">Student News</p>
          <p className="news__popup-text">Coming soon. You will get student news here once we connect to the server.</p>
          <p className="news__popup-hint">Shortcut: press N to toggle.</p>
        </div>
      )}
    </div>
  );
}
