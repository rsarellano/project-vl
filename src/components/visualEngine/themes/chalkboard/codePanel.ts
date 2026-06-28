import type { CodePanelTheme } from "../types";
import { CHALKBOARD_TOKENS } from "./tokens";

/** Chalk-on-board code panel for code-map stages. */
export const chalkboardCodePanelTheme: CodePanelTheme = {
  fill: "rgba(0,0,0,0.22)",
  stroke: CHALKBOARD_TOKENS.stepStroke,
  strokeWidth: 2,
  radius: 10,
  highlightRadius: 8,
  labelColor: CHALKBOARD_TOKENS.chalkDim,
  monoFont: CHALKBOARD_TOKENS.chalkFont,
  syntax: {
    default: CHALKBOARD_TOKENS.chalkWhite,
    keyword: CHALKBOARD_TOKENS.chalkPink,
    typeName: "#9dd4f0",
    property: "#c8e8f8",
    typeLiteral: "#b8e0c8",
    string: CHALKBOARD_TOKENS.chalkGold,
    number: "#f0d890",
    punctuation: CHALKBOARD_TOKENS.chalkDim,
    operator: "rgba(242,242,234,0.75)",
  },
};
