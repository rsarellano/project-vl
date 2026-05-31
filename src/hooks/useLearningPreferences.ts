"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getLearningPreferences,
  saveLearningPreferences,
  type UserLearningPreferences,
} from "@/lib/userPreferences";

export function useLearningPreferences() {
  const [prefs, setPrefs] = useState<UserLearningPreferences | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(getLearningPreferences());
    setReady(true);
  }, []);

  const save = useCallback((next: UserLearningPreferences) => {
    saveLearningPreferences(next);
    setPrefs(next);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem("project-vl-learning-preferences");
    setPrefs(null);
  }, []);

  return { prefs, ready, save, clear, hasPrefs: prefs !== null };
}
