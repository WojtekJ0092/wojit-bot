// ---------------------------------------------------------------------------
// NukeEgg — press N 15 times fast → screen goes black and vibrates
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";

const REQUIRED = 15;
const WINDOW_MS = 3000; // must press 15 times within 3 seconds
const EFFECT_MS = 2500; // how long the blackout + vibration lasts

export function NukeEgg() {
  const [active, setActive] = useState(false);
  const timestamps = useRef<number[]>([]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (active) return;
      if (e.key !== "n" && e.key !== "N") return;
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const now = Date.now();
      timestamps.current.push(now);
      // Keep only presses within the time window
      timestamps.current = timestamps.current.filter((t) => now - t < WINDOW_MS);

      if (timestamps.current.length >= REQUIRED) {
        timestamps.current = [];
        setActive(true);
        // Try hardware vibration (mobile)
        try { navigator.vibrate?.([100, 50, 100, 50, 200, 50, 100, 50, 100]); } catch { /* noop */ }
        setTimeout(() => setActive(false), EFFECT_MS);
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [active]);

  if (!active) return null;

  return <div className="nuke-egg" />;
}
