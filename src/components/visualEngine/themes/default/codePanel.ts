import type { CodePanelTheme } from "../types";

/** VS Code / Cursor Dark+ inspired palette for the default code-map panel. */
export const defaultCodePanelTheme: CodePanelTheme = {
  fill: "#1e1e1e",
  stroke: "#3c3c3c",
  strokeWidth: 1,
  radius: 0,
  highlightRadius: 0,
  labelColor: "#858585",
  monoFont:
    'var(--font-geist-mono), "JetBrains Mono", "Fira Code", "Consolas", monospace',
  syntax: {
    default: "#d4d4d4",
    keyword: "#569cd6",
    typeName: "#4ec9b0",
    property: "#9cdcfe",
    typeLiteral: "#4ec9b0",
    string: "#ce9178",
    number: "#b5cea8",
    punctuation: "#d4d4d4",
    operator: "#d4d4d4",
  },
};
