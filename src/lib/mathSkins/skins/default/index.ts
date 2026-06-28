import type { MathSkinDefinition } from "../../types";

/**
 * Default (clean) theme — KaTeX only for step-box math.
 * SVG assets under `public/math-skins/default/` are reserved for the ``stickers`` skin.
 */
export const defaultMathSkin: MathSkinDefinition = {
  id: "default",
  label: "Default (KaTeX)",
  assetPrefix: "mathDefault",
  assetBasePath: "/math-skins/default",
  defaultAdvance: 20,
  unitScale: 1,
  superscriptScale: 0.72,
  superscriptRaise: 1,
  katexOnly: true,
};
