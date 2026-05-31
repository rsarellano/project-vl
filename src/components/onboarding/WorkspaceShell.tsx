"use client";

import { useCallback, useState } from "react";
import TestPage from "@/components/testPage";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { PreferencesSummary } from "@/components/onboarding/PreferencesSummary";
import { useLearningPreferences } from "@/hooks/useLearningPreferences";
import type { UserLearningPreferences } from "@/lib/userPreferences";

export function WorkspaceShell() {
  const { prefs, ready, save, hasPrefs } = useLearningPreferences();
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

  if (!ready) {
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
        <PreferencesSummary preferences={prefs} onChange={handleChangePreferences} />
      ) : null}
      <div className="min-h-0 flex-1">
        <TestPage preferences={prefs} />
      </div>
    </div>
  );
}
