import type { Theme } from "../types";
import { CyberpunkBackgroundDecor } from "./BackgroundDecor";
import { CyberpunkBoxSticker } from "./BoxSticker";
import { CyberpunkDefs } from "./SharedDefs";
import { cyberpunkCodePanelTheme } from "./codePanel";
import { CYBERPUNK_TOKENS } from "./tokens";

export const cyberpunkTheme: Theme = {
  name: "cyberpunk",
  label: "Cyberpunk (neon)",
  canvasColor: CYBERPUNK_TOKENS.canvas,
  codePanel: cyberpunkCodePanelTheme,
  Defs: CyberpunkDefs,
  BackgroundDecor: CyberpunkBackgroundDecor,
  BoxSticker: CyberpunkBoxSticker,
};
