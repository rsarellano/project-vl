import type { MathSkinDefinition } from "../../types";

/**
 * Chalkboard glyph skin — drop SVGs into `public/math-skins/chalkboard/`.
 * Hybrid mode: chars listed in `availableGlyphs` use your SVG files;
 * everything else falls back to chalk-styled KaTeX.
 */
export const chalkboardMathSkin: MathSkinDefinition = {
  id: "chalkboard",
  label: "Chalkboard glyphs",
  assetPrefix: "mathChalkboard",
  assetBasePath: "/math-skins/chalkboard",
  defaultAdvance: 22,
  unitScale: 1,
  superscriptScale: 0.72,
  superscriptRaise: 1,
  sqrtStrokeColor: "#6ec8e8",
  hybridGlyphs: true,
  availableGlyphs: new Set(["5", "9"]),
  katexFallback: { chalk: true },
};
