"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THEME, type ThemeName } from "@/components/visualEngine/themes";
import {
  getStoredDiagramTheme,
  saveDiagramTheme,
} from "@/lib/diagramTheme";

export function useDiagramTheme() {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(getStoredDiagramTheme());
    setReady(true);
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    saveDiagramTheme(next);
  }, []);

  return { theme, setTheme, ready };
}
