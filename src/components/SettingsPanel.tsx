// ---------------------------------------------------------------------------
// SettingsPanel — top-right gear button that opens a floating options panel
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeedMode = "fast" | "normal" | "slow" | "kubica";
export type ToneMode = "technical" | "friendly";
type Theme = "light" | "dark";

/** Spawn an F1 car that zooms across the screen */
function launchF1Car() {
  const car = document.createElement("div");
  car.className = "f1-car";
  car.textContent = "🏎️";
  document.body.appendChild(car);
  // Remove after animation ends
  car.addEventListener("animationend", () => car.remove());
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem("wojit-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch { /* ignore */ }
  return "light";
}

function getStoredSpeed(): SpeedMode {
  try {
    const stored = localStorage.getItem("wojit-speed");
    if (stored === "fast" || stored === "normal" || stored === "slow" || stored === "kubica") return stored;
  } catch { /* ignore */ }
  return "normal";
}

function getStoredTone(): ToneMode {
  try {
    const stored = localStorage.getItem("wojit-tone");
    if (stored === "technical" || stored === "friendly") return stored;
  } catch { /* ignore */ }
  return "technical";
}

interface SettingsPanelProps {
  onSpeedChange: (speed: SpeedMode) => void;
  onToneChange: (tone: ToneMode) => void;
}

export function SettingsPanel({ onSpeedChange, onToneChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [speed, setSpeed] = useState<SpeedMode>(getStoredSpeed);
  const [tone, setTone] = useState<ToneMode>(getStoredTone);
  const panelRef = useRef<HTMLDivElement>(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("wojit-theme", theme); } catch { /* ignore */ }
  }, [theme]);

  // Persist speed & notify parent
  useEffect(() => {
    try { localStorage.setItem("wojit-speed", speed); } catch { /* ignore */ }
    onSpeedChange(speed);
    if (speed === "kubica") launchF1Car();
  }, [speed, onSpeedChange]);

  // Persist tone & notify parent
  useEffect(() => {
    try { localStorage.setItem("wojit-tone", tone); } catch { /* ignore */ }
    onToneChange(tone);
  }, [tone, onToneChange]);

  // Emit initial values on mount
  useEffect(() => {
    onSpeedChange(getStoredSpeed());
    onToneChange(getStoredTone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <div className="settings" ref={panelRef}>
      <button
        type="button"
        className="settings__gear"
        onClick={() => setOpen((o) => !o)}
        title="Settings"
        aria-label="Settings"
      >
        ⚙️
      </button>

      {open && (
        <div className="settings__panel">
          {/* Theme row */}
          <div className="settings__row">
            <span className="settings__label">Theme</span>
            <button
              type="button"
              className="settings__toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "🌙 Dark" : "☀️ Light"}
            </button>
          </div>

          {/* Speed row */}
          <div className="settings__row">
            <span className="settings__label">Speed</span>
            <div className="settings__speed-buttons">
              {(["slow", "normal", "fast", "kubica"] as SpeedMode[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`settings__speed-btn ${speed === s ? "settings__speed-btn--active" : ""}`}
                  onClick={() => setSpeed(s)}
                >
                  {s === "slow" ? "🐢" : s === "normal" ? "🚶" : s === "fast" ? "⚡" : "🏎️"} {s === "kubica" ? "Robert Kubica" : s}
                </button>
              ))}
            </div>
          </div>

          {/* Tone row */}
          <div className="settings__row">
            <span className="settings__label">Tone</span>
            <div className="settings__speed-buttons">
              <button
                type="button"
                className={`settings__speed-btn ${tone === "technical" ? "settings__speed-btn--active" : ""}`}
                onClick={() => setTone("technical")}
              >
                🔬 Technical
              </button>
              <button
                type="button"
                className={`settings__speed-btn ${tone === "friendly" ? "settings__speed-btn--active" : ""}`}
                onClick={() => setTone("friendly")}
              >
                💬 Friendly
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
