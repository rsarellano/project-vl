"use client";

import {
  formatPreferencesLabel,
  SUBJECT_DOMAINS,
  USAGE_CONTEXTS,
  type UserLearningPreferences,
} from "@/lib/userPreferences";
import { ThemeSelect } from "@/components/visualEngine/ThemeSelect";
import type { ThemeName } from "@/components/visualEngine/themes";

type PreferencesSummaryProps = {
  preferences: UserLearningPreferences;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  onChange: () => void;
};

export function PreferencesSummary({
  preferences,
  theme,
  onThemeChange,
  onChange,
}: PreferencesSummaryProps) {
  const usage =
    USAGE_CONTEXTS.find((u) => u.id === preferences.usageContext)?.label ?? preferences.usageContext;
  const subject =
    SUBJECT_DOMAINS.find((s) => s.id === preferences.subjectDomain)?.label ??
    preferences.subjectDomain;

  return (
    <div className="shrink-0 border-b border-blue-100 bg-blue-50 px-4 py-2.5 dark:border-blue-900/50 dark:bg-blue-950/40 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Your setup</span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
            {usage}
          </span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
            {subject}
          </span>
          <span className="text-xs text-slate-500" title={formatPreferencesLabel(preferences)}>
            Saved in this browser
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeSelect
            id="workspace-theme"
            value={theme}
            onChange={onThemeChange}
          />
          <button
            type="button"
            onClick={onChange}
            className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
          >
            Change setup
          </button>
        </div>
      </div>
    </div>
  );
}
