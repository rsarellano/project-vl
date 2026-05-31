import {
  DEFAULT_THEME,
  type ThemeName,
} from "@/components/visualEngine/themes";

const STORAGE_KEY = "project-vl-diagram-theme";

const VALID_THEMES = new Set<ThemeName>(["default", "cyberpunk"]);

export function getStoredDiagramTheme(): ThemeName {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_THEMES.has(raw as ThemeName)) {
      return raw as ThemeName;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function saveDiagramTheme(theme: ThemeName): void {
  localStorage.setItem(STORAGE_KEY, theme);
}
