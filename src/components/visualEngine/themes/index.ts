/**
 * Theme registry. To add a new theme (e.g. `anime`):
 *
 *   1. Create `themes/<name>/` with `BoxSticker.tsx`, `SharedDefs.tsx`,
 *      `BackgroundDecor.tsx`, optional `tokens.ts`, and `index.ts`.
 *   2. Add the new name to the `ThemeName` union in `themes/types.ts`.
 *   3. Import its theme object below and add it to `THEMES`.
 *
 * That's the entire integration surface — nothing else in the visual
 * engine needs to know the new theme exists.
 */

import type { Theme, ThemeName } from "./types";
import { defaultTheme } from "./default";
import { cyberpunkTheme } from "./cyberpunk";

export type { Theme, ThemeName, BoxStickerProps } from "./types";

export const THEMES: Record<ThemeName, Theme> = {
  default: defaultTheme,
  cyberpunk: cyberpunkTheme,
};

/** Drop-in options array for `<select>` pickers. */
export const THEME_OPTIONS: ReadonlyArray<{ value: ThemeName; label: string }> = (
  Object.values(THEMES) as Theme[]
).map((t) => ({ value: t.name, label: t.label }));

/** Default theme used when no `theme` prop is passed. */
export const DEFAULT_THEME: ThemeName = "default";

export function getTheme(name: ThemeName | undefined): Theme {
  return THEMES[name ?? DEFAULT_THEME];
}

export function getCodePanelTheme(name: ThemeName | undefined) {
  return getTheme(name).codePanel;
}
