// ---------------------------------------------------------------------------
// FilterBar — collapsible multi-select dropdowns for country, school_type, cohort_year
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Filters, Taxonomy } from "@/api";

/** Map country codes to ISO 3166-1 alpha-2 for flag CDN */
const FLAG_CODES: Record<string, string> = {
  PL: "pl",
  UK: "gb",
  DE: "de",
  FR: "fr",
  ES: "es",
};

/** Map school types to emojis */
const SCHOOL_TYPE_EMOJIS: Record<string, string> = {
  public: "🏫",
  private: "🎓",
  technical: "⚙️",
  military: "🪖",
  SEN: "❤️",
  home: "🏠",
  christian: "✝️",
};

/** Render country code with a real flag image */
function CountryLabel({ code }: { code: string }) {
  const isoCode = FLAG_CODES[code.toUpperCase()] ?? code.toLowerCase();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <img
        src={`https://flagcdn.com/w40/${isoCode}.png`}
        alt={`${code} flag`}
        width={20}
        height={15}
        style={{ borderRadius: "2px", objectFit: "cover" }}
      />
      {code}
    </span>
  );
}

/** Render school type with emoji */
function SchoolTypeLabel({ type }: { type: string }) {
  const emoji = SCHOOL_TYPE_EMOJIS[type] ?? "🏫";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "1.1em" }}>{emoji}</span>
      {type}
    </span>
  );
}

interface FilterBarProps {
  taxonomy: Taxonomy | null;
  filters: Filters;
  onChange: (filters: Filters) => void;
  disabled?: boolean;
}

// ---- Collapsible multi-select dropdown ------------------------------------

interface DropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  renderOption?: (value: string) => ReactNode;
  displayFn?: (value: string) => string;
}

function Dropdown({ label, options, selected, onToggle, disabled, renderOption, displayFn }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const display = displayFn ?? ((v: string) => v);
  const summary =
    selected.length === 0
      ? `All`
      : selected.map(display).join(", ");

  return (
    <div className={`dropdown ${open ? "dropdown--open" : ""}`} ref={ref}>
      <span className="dropdown__label">{label}</span>
      <button
        type="button"
        className="dropdown__trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
      >
        <span className="dropdown__summary">{summary}</span>
        <span className="dropdown__arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="dropdown__menu">
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <li key={opt}>
                <button
                  type="button"
                  className={`dropdown__option ${isSelected ? "dropdown__option--selected" : ""}`}
                  onClick={() => onToggle(opt)}
                >
                  <span className="dropdown__check">{isSelected ? "✓" : ""}</span>
                  {renderOption ? renderOption(opt) : display(opt)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- FilterBar main -------------------------------------------------------

export function FilterBar({ taxonomy, filters, onChange, disabled }: FilterBarProps) {
  const toggle = useCallback(
    (facet: keyof Filters, value: string) => {
      if (facet === "cohort_year") {
        const num = Number(value);
        const current = filters.cohort_year;
        const next = current.includes(num)
          ? current.filter((v) => v !== num)
          : [...current, num];
        onChange({ ...filters, cohort_year: next });
      } else {
        const current = filters[facet] as string[];
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        onChange({ ...filters, [facet]: next });
      }
    },
    [filters, onChange],
  );

  if (!taxonomy) {
    return <div className="filter-bar filter-bar--loading">Loading filters…</div>;
  }

  return (
    <div className="filter-bar">
      <Dropdown
        label="Country"
        options={taxonomy.country}
        selected={filters.country}
        onToggle={(v) => toggle("country", v)}
        disabled={disabled}
        renderOption={(v) => <CountryLabel code={v} />}
      />
      <Dropdown
        label="School type"
        options={taxonomy.school_type}
        selected={filters.school_type}
        onToggle={(v) => toggle("school_type", v)}
        disabled={disabled}
        renderOption={(v) => <SchoolTypeLabel type={v} />}
      />
      <Dropdown
        label="Cohort year"
        options={taxonomy.cohort_year.map(String)}
        selected={filters.cohort_year.map(String)}
        onToggle={(v) => toggle("cohort_year", v)}
        disabled={disabled}
        displayFn={(v) => `Year ${v}`}
      />
    </div>
  );
}
