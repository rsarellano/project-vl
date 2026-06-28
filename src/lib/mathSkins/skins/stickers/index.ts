import type { MathSkinDefinition } from "../../types";

/**
 * Sticker glyph skin — hybrid SVG + KaTeX fallback.
 * Uses SVGs in `public/math-skins/default/` (not wired to any theme yet).
 * Set a theme's ``mathSkin`` to ``"stickers"`` when ready to ship this look.
 */
export const stickersMathSkin: MathSkinDefinition = {
  id: "stickers",
  label: "Sticker glyphs",
  assetPrefix: "mathDefault",
  assetBasePath: "/math-skins/default",
  glyphFolders: {
    digits: "digits",
    letters: "letters",
    operators: "operators",
    special: "special",
  },
  specialAssetFolders: {
    sqrtRadical: "operators",
  },
  defaultAdvance: 20,
  unitScale: 1,
  superscriptScale: 0.72,
  superscriptRaise: 1,
  hybridGlyphs: true,
  glyphLayout: {
    height: 20,
    baselineAnchor: 0.82,
  },
  glyphVerticalOffset: {
    "±": 4,
  },
  glyphHeight: {
    "±": 20,
  },
  sqrtStrokeColor: "#111827",
  sqrtLayout: {
    hookViewBoxWidth: 5,
    hookViewBoxHeight: 16,
    hookHeight: 26,
    barAttachXRatio: 0.823,
    vinculumYRatio: 0.031,
    vinculumStrokeWidth: 1.5,
    innerPadRight: 4,
    verticalOffset: 6,
  },
  availableGlyphs: new Set<string>([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "x",
    "+",
    "-",
    "=",
    "±",
    "*",
    "/",
    ".",
    "(",
    ")",
  ]),
};
