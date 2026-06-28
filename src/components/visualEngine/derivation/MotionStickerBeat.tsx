"use client";

import KatexMathHtml from "@/components/visualEngine/KatexMathHtml";
import { SkinMathInline } from "@/components/visualEngine/SkinMathSvg";
import { canRenderWithSkin } from "@/lib/mathSkins";
import type { MathSkinId } from "@/lib/mathSkins/types";

const MOTION_STICKER_SKIN: MathSkinId = "stickers";
const MOTION_FONT_SIZE = 16;

type MotionStickerBeatProps = {
  expression: string;
  glyphIdPrefix: string;
  chalk?: boolean;
};

/**
 * Sticker SVG equation for a single cinematic beat (detail panel only).
 * Falls back to KaTeX when stickers cannot lay out the expression.
 */
export default function MotionStickerBeat({
  expression,
  glyphIdPrefix,
  chalk,
}: MotionStickerBeatProps) {
  const canUseStickers = canRenderWithSkin(expression, MOTION_STICKER_SKIN);

  if (!canUseStickers) {
    return (
      <KatexMathHtml
        expression={expression}
        chalk={chalk}
        className="opacity-90"
      />
    );
  }

  return (
    <SkinMathInline
      expression={expression}
      skinId={MOTION_STICKER_SKIN}
      fontSize={MOTION_FONT_SIZE}
      glyphIdPrefix={glyphIdPrefix}
      glyphHover={false}
      className="mx-auto block"
    />
  );
}
