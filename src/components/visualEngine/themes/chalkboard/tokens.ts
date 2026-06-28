/**
 * Chalkboard theme palette — green board, dusty chalk strokes, warm accents.
 */

export const CHALKBOARD_TOKENS = {
  canvas: "#2f4f3f",
  canvasDark: "#243d32",
  boardSmudge: "rgba(255,255,255,0.04)",

  chalkWhite: "#f2f2ea",
  chalkDim: "rgba(242,242,234,0.55)",
  chalkPink: "#f0a0b8",
  chalkGold: "#e8d060",

  stepStroke: "rgba(242,242,234,0.35)",
  stepFill: "rgba(0,0,0,0.14)",
  answerStroke: "#e8d060",
  answerFill: "rgba(232,208,96,0.08)",

  connectorStroke: "rgba(242,242,234,0.28)",

  chalkFont: 'var(--font-patrick-hand), "Patrick Hand", "Segoe Print", cursive',

  filterChalkId: "vl-chalk-text-grain",
  filterChalkSoftId: "vl-chalk-soft-glow",
  patternBoardId: "vl-chalkboard-texture",
} as const;

export const CHALKBOARD_MATH_DETAIL = {
  fill: "rgba(0,0,0,0.14)",
  stroke: "rgba(242,242,234,0.28)",
  strokeWidth: 1.5,
  labelColor: "rgba(242,242,234,0.55)",
} as const;
