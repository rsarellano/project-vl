"use client";

import { THEME_OPTIONS, type ThemeName } from "@/components/visualEngine/themes";

type ThemeSelectProps = {
  value: ThemeName;
  onChange: (theme: ThemeName) => void;
  id?: string;
  className?: string;
};

/** Shared theme picker for workspace toolbar + diagram controls. */
export function ThemeSelect({
  value,
  onChange,
  id = "diagram-theme",
  className = "",
}: ThemeSelectProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-1.5 text-xs font-medium text-slate-600 ${className}`.trim()}
    >
      <span className="uppercase tracking-wide">Theme</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as ThemeName)}
        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {THEME_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
