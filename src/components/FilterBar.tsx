// ---------------------------------------------------------------------------
// FilterBar — collapsible multi-select dropdowns for country, school_type, cohort_year
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import type { Filters, Taxonomy } from "@/api";

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
  displayFn?: (value: string) => string;
}

function Dropdown({ label, options, selected, onToggle, disabled, displayFn }: DropdownProps) {
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
                  {display(opt)}
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
      />
      <Dropdown
        label="School type"
        options={taxonomy.school_type}
        selected={filters.school_type}
        onToggle={(v) => toggle("school_type", v)}
        disabled={disabled}
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
