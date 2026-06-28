import { canMapCharToSkinAsset } from "./glyphAssets";
import { layoutSkinMath } from "./layout";
import { getMathSkin } from "./registry";
import {
  expressionUsesOnlyKnownGlyphs,
  flattenTokenChars,
  tokenizeMathExpression,
} from "./tokenize";
import type { MathSkinId, SkinMathLayout } from "./types";

export function canRenderWithSkin(expression: string, skinId: MathSkinId): boolean {
  const skin = getMathSkin(skinId);
  if (!skin || skin.katexOnly) return false;

  if (skin.hybridGlyphs && skin.availableGlyphs?.size) {
    const chars = flattenTokenChars(tokenizeMathExpression(expression));
    return chars.some((ch) => skin.availableGlyphs!.has(ch.toLowerCase()));
  }

  return expressionUsesOnlyKnownGlyphs(
    expression,
    skin.assetPrefix,
    canMapCharToSkinAsset,
  );
}

export function renderSkinMathLayout(
  expression: string,
  skinId: MathSkinId,
  fontSize: number,
): SkinMathLayout | null {
  const skin = getMathSkin(skinId);
  if (!skin) return null;
  if (!canRenderWithSkin(expression, skinId)) return null;

  const tokens = tokenizeMathExpression(expression);
  const layout = layoutSkinMath(tokens, skin, fontSize);
  if (!layout.supported) return null;
  return layout;
}
