"use client";

import { useCallback, useState } from "react";
import VisualPage from "@/components/VisualPage";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { PreferencesSummary } from "@/components/onboarding/PreferencesSummary";
import { useDiagramTheme } from "@/hooks/useDiagramTheme";
import { useLearningPreferences } from "@/hooks/useLearningPreferences";
import type { UserLearningPreferences } from "@/lib/userPreferences";

export function WorkspaceShell() {
  const { prefs, ready, save, hasPrefs } = useLearningPreferences();
  const { theme, setTheme, ready: themeReady } = useDiagramTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleComplete = useCallback(
    (next: UserLearningPreferences) => {
      save(next);
      setShowOnboarding(false);
    },
    [save],
  );

  const handleChangePreferences = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  if (!ready || !themeReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading workspace…
      </div>
    );
  }

  const modalOpen = showOnboarding || !hasPrefs;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <OnboardingModal open={modalOpen} onComplete={handleComplete} />
      {prefs && !modalOpen ? (
        <PreferencesSummary
          preferences={prefs}
          theme={theme}
          onThemeChange={setTheme}
          onChange={handleChangePreferences}
        />
      ) : null}
      <div className="min-h-0 flex-1">
        <VisualPage preferences={prefs} theme={theme} onThemeChange={setTheme} />
      </div>
    </div>
  );
}
