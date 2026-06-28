"use client";

import { SkinMathInline } from "@/components/visualEngine/SkinMathSvg";
import { canRenderWithSkin } from "@/lib/mathSkins";
import type { MathSkinId } from "@/lib/mathSkins";
import { renderMathHtml } from "@/lib/mathText";

type MathExpressionPreviewProps = {
  expression: string;
  mathSkin?: MathSkinId;
  chalk?: boolean;
  fontSize?: number;
  className?: string;
};

export default function MathExpressionPreview({
  expression,
  mathSkin,
  chalk = false,
  fontSize = 18,
  className = "",
}: MathExpressionPreviewProps) {
  if (mathSkin && canRenderWithSkin(expression, mathSkin)) {
    return (
      <SkinMathInline
        expression={expression}
        skinId={mathSkin}
        fontSize={fontSize}
        className={className}
      />
    );
  }

  return (
    <div
      className={`${chalk ? "katex-chalk" : ""} ${className}`.trim()}
      dangerouslySetInnerHTML={{
        __html: renderMathHtml(expression, chalk ? { chalk: true } : undefined),
      }}
    />
  );
}
