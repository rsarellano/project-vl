import type { CodePanelTheme } from "../types";
import { CYBERPUNK_TOKENS } from "./tokens";

/** Neon HUD code panel — separate from the default IDE-like skin. */
export const cyberpunkCodePanelTheme: CodePanelTheme = {
  fill: "#0a1628",
  stroke: CYBERPUNK_TOKENS.primaryNeon,
  strokeWidth: 1.5,
  radius: 12,
  highlightRadius: 12,
  labelColor: CYBERPUNK_TOKENS.textDim,
  monoFont: CYBERPUNK_TOKENS.monoFont,
  syntax: {
    default: CYBERPUNK_TOKENS.textPrimary,
    keyword: CYBERPUNK_TOKENS.primaryNeon,
    typeName: "#67e8f9",
    property: "#a5f3fc",
    typeLiteral: "#2dd4bf",
    string: CYBERPUNK_TOKENS.answerNeon,
    number: "#86efac",
    punctuation: "#64748b",
    operator: "#94a3b8",
  },
};
