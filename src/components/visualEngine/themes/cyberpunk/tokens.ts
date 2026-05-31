/**
 * Cyberpunk theme palette and shape tokens. Centralized so swapping the
 * neon hues or corner cut size cascades everywhere automatically.
 */

export const CYBERPUNK_TOKENS = {
  /** SVG canvas background. Deep navy-black to make neon strokes glow. */
  canvas: "#0b1220",

  /** Neon hues. Cyan = step boxes, magenta = answer box. */
  primaryNeon: "#22d3ee",
  answerNeon: "#f472b6",

  /** Body text. Pale variants of the neon colors so they read on the dark canvas. */
  textPrimary: "#e0f2fe",
  textAnswer: "#fce7f3",
  /** Step labels ("// STEP_03"). Dim slate, like a code comment. */
  textDim: "#64748b",

  /** Subtle grid color used by the canvas-wide pattern. */
  gridLine: "#1e293b",

  /** Diagonal corner cut size on each box (px). Top-left and bottom-right are sliced. */
  cornerCut: 24,

  /** Monospace font stack for body + labels (cyberpunk = code-adjacent). */
  monoFont: '"JetBrains Mono", "Fira Code", "Courier New", monospace',

  filterCyanId: "vl-cyberpunk-glow-cyan",
  filterMagentaId: "vl-cyberpunk-glow-magenta",
  patternGridId: "vl-cyberpunk-grid",
} as const;
