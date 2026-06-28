import { renderMathHtml } from "@/lib/mathText";
import {
  canMapCharToSkinAsset,
  getSkinGlyphAssetUrl,
  getSkinSpecialAssetUrl,
} from "./glyphAssets";
import { tokensToLatex } from "./tokenize";
import type {
  MathSkinDefinition,
  MathToken,
  PlacedGlyph,
  SkinMathLayout,
} from "./types";

type LayoutContext = {
  skin: MathSkinDefinition;
  fontSize: number;
  scale: number;
};

function skinScale(skin: MathSkinDefinition, fontSize: number): number {
  return (fontSize / 20) * skin.unitScale;
}

function glyphAdvance(skin: MathSkinDefinition, ch: string, scale: number): number {
  const base = skin.glyphAdvance?.[ch] ?? skin.defaultAdvance;
  return base * scale;
}

function usesHybrid(skin: MathSkinDefinition): boolean {
  return Boolean(skin.hybridGlyphs && skin.availableGlyphs?.size);
}

function hasSvgFile(skin: MathSkinDefinition, ch: string): boolean {
  if (!usesHybrid(skin)) return true;
  return skin.availableGlyphs!.has(ch.toLowerCase());
}

function glyphBaselineAnchor(skin: MathSkinDefinition): number {
  return skin.glyphLayout?.baselineAnchor ?? 0.82;
}

function glyphHeightForChar(
  skin: MathSkinDefinition,
  ch: string,
  scale: number,
  ctxScale: number,
): number {
  const heightPx = skin.glyphHeight?.[ch] ?? skin.glyphLayout?.height ?? 20;
  return heightPx * scale * ctxScale;
}

function glyphVerticalNudge(
  skin: MathSkinDefinition,
  ch: string,
  scale: number,
  ctxScale: number,
): number {
  return (skin.glyphVerticalOffset?.[ch] ?? 0) * scale * ctxScale;
}

function layoutTokens(
  tokens: MathToken[],
  ctx: LayoutContext,
  startX = 0,
  startY = 0,
): { glyphs: PlacedGlyph[]; width: number; height: number; supported: boolean } {
  const glyphs: PlacedGlyph[] = [];
  let supported = true;
  let maxY = startY + 20 * ctx.scale;
  let minY = startY;

  function katexChunkWidth(latex: string, scale: number): number {
    const base = glyphAdvance(ctx.skin, "0", scale * ctx.scale);
    if (latex.length <= 1) return base;
    return Math.max(base * 1.4, ctx.fontSize * 0.72 * latex.length);
  }

  function placeKatex(latex: string, atX: number, atY: number, scale: number): number {
    const chalk = ctx.skin.katexFallback?.chalk ?? false;
    const html = renderMathHtml(latex, chalk ? { chalk: true } : undefined);
    const advance = katexChunkWidth(latex, scale * ctx.scale);
    const height = Math.max(20 * scale * ctx.scale, ctx.fontSize * 1.05);
    glyphs.push({
      kind: "katex",
      html,
      x: atX,
      y: atY - height * 0.82,
      width: advance,
      height,
      chalk,
    });
    return advance;
  }

  function placeChar(ch: string, atX: number, atY: number, scale: number): number {
    if (!canMapCharToSkinAsset(ctx.skin.assetPrefix, ch)) {
      if (usesHybrid(ctx.skin)) {
        return placeKatex(ch, atX, atY, scale);
      }
      supported = false;
      return 10 * scale * ctx.scale;
    }

    if (!hasSvgFile(ctx.skin, ch)) {
      return placeKatex(ch, atX, atY, scale);
    }

    const href = getSkinGlyphAssetUrl(ctx.skin, ch);
    if (!href) {
      if (usesHybrid(ctx.skin)) {
        return placeKatex(ch, atX, atY, scale);
      }
      supported = false;
      return 10 * scale * ctx.scale;
    }

    const advance = glyphAdvance(ctx.skin, ch, scale * ctx.scale);
    const height = glyphHeightForChar(ctx.skin, ch, scale, ctx.scale);
    const verticalNudge = glyphVerticalNudge(ctx.skin, ch, scale, ctx.scale);
    glyphs.push({
      kind: "image",
      href,
      char: ch,
      x: atX,
      y: atY - height * glyphBaselineAnchor(ctx.skin) + verticalNudge,
      width: advance,
      height,
    });
    return advance;
  }

  function layoutSequence(
    seq: MathToken[],
    baseX: number,
    baseY: number,
    scale: number,
  ): number {
    let cursor = baseX;
    for (let idx = 0; idx < seq.length; idx += 1) {
      const token = seq[idx];

      if (token.type === "char") {
        const advance = placeChar(token.value, cursor, baseY, scale);
        cursor += advance;
        const next = seq[idx + 1];
        if (next?.type === "sup") {
          const supScale = scale * ctx.skin.superscriptScale;
          const supY = baseY - 10 * ctx.scale * ctx.skin.superscriptRaise;
          let supX = cursor - advance * 0.15;
          for (const child of next.children) {
            if (child.type === "char") {
              supX += placeChar(child.value, supX, supY, supScale);
            } else {
              supX += layoutSequence([child], supX, supY, supScale);
            }
          }
          idx += 1;
        }
        continue;
      }

      if (token.type === "group") {
        if (usesHybrid(ctx.skin) && (!hasSvgFile(ctx.skin, "(") || !hasSvgFile(ctx.skin, ")"))) {
          const latex = `(${tokensToLatex(token.children)})`;
          const next = seq[idx + 1];
          const full =
            next?.type === "sup"
              ? `${latex}^{${tokensToLatex(next.children)}}`
              : latex;
          cursor += placeKatex(full, cursor, baseY, scale);
          if (next?.type === "sup") idx += 1;
          continue;
        }

        cursor += placeChar("(", cursor, baseY, scale);
        cursor += layoutSequence(token.children, cursor, baseY, scale);
        cursor += placeChar(")", cursor, baseY, scale);
        const next = seq[idx + 1];
        if (next?.type === "sup") {
          const supScale = scale * ctx.skin.superscriptScale;
          const supY = baseY - 10 * ctx.scale * ctx.skin.superscriptRaise;
          let supX = cursor - 4 * ctx.scale;
          for (const child of next.children) {
            if (child.type === "char") {
              supX += placeChar(child.value, supX, supY, supScale);
            } else {
              supX += layoutSequence([child], supX, supY, supScale);
            }
          }
          idx += 1;
        }
        continue;
      }

      if (token.type === "sqrt") {
        const radicalHref = getSkinSpecialAssetUrl(ctx.skin, "sqrtRadical");
        const sqrtCfg = ctx.skin.sqrtLayout ?? {};
        const hookViewW = sqrtCfg.hookViewBoxWidth ?? 5;
        const hookViewH = sqrtCfg.hookViewBoxHeight ?? 16;
        const hookHeightPx = (sqrtCfg.hookHeight ?? 26) * ctx.scale * scale;
        const hookWidthPx = hookHeightPx * (hookViewW / hookViewH);
        const barAttachXRatio = sqrtCfg.barAttachXRatio ?? 4.11451 / hookViewW;
        const vinculumYOnHook = sqrtCfg.vinculumYRatio ?? 0.5 / hookViewH;
        const innerPadRight = (sqrtCfg.innerPadRight ?? 4) * ctx.scale;

        const innerLayout = layoutTokens(token.children, ctx, 0, 0);
        const innerWidth = innerLayout.width;
        const radicandBaseline = baseY;
        const sqrtVerticalOffset =
          (sqrtCfg.verticalOffset ?? 0) * ctx.scale * scale;

        const innerStartX = cursor + hookWidthPx * barAttachXRatio;
        const hookTop = radicandBaseline - hookHeightPx + sqrtVerticalOffset;
        const vinculumY = hookTop + hookHeightPx * vinculumYOnHook;
        const vinculumEndX = innerStartX + innerWidth + innerPadRight;
        const vinculumLen = vinculumEndX - innerStartX;

        glyphs.push({
          kind: "image",
          href: radicalHref,
          char: "√",
          x: cursor,
          y: hookTop,
          width: hookWidthPx,
          height: hookHeightPx,
          preserveAspectRatio: "xMinYMax meet",
        });

        if (vinculumLen > 0) {
          const lineScale = ctx.scale * scale;
          glyphs.push({
            kind: "stroke",
            path: `M 0 0 H ${vinculumLen / lineScale}`,
            stroke: ctx.skin.sqrtStrokeColor ?? "#111827",
            x: innerStartX,
            y: vinculumY,
            scale: lineScale,
            strokeWidth: sqrtCfg.vinculumStrokeWidth ?? 1,
          });
        }

        for (const g of innerLayout.glyphs) {
          glyphs.push({ ...g, x: g.x + innerStartX, y: g.y + radicandBaseline });
        }

        cursor = innerStartX + innerWidth + innerPadRight;

        const next = seq[idx + 1];
        if (next?.type === "sup") {
          const supScale = scale * ctx.skin.superscriptScale;
          const supY = baseY - 14 * ctx.scale * ctx.skin.superscriptRaise;
          let supX = cursor - 6 * ctx.scale;
          for (const child of next.children) {
            if (child.type === "char") {
              supX += placeChar(child.value, supX, supY, supScale);
            } else {
              supX += layoutSequence([child], supX, supY, supScale);
            }
          }
          idx += 1;
        }
        continue;
      }

      if (token.type === "sup") {
        const supScale = scale * ctx.skin.superscriptScale;
        const supY = baseY - 10 * ctx.scale * ctx.skin.superscriptRaise;
        let supX = cursor;
        for (const child of token.children) {
          if (child.type === "char") {
            supX += placeChar(child.value, supX, supY, supScale);
          } else {
            supX += layoutSequence([child], supX, supY, supScale);
          }
        }
        cursor = supX;
      }
    }

    maxY = Math.max(maxY, baseY + 4 * ctx.scale);
    minY = Math.min(minY, baseY - 14 * ctx.scale);
    return cursor - baseX;
  }

  const width = layoutSequence(tokens, startX, startY, 1);
  return { glyphs, width, height: maxY - minY, supported: usesHybrid(ctx.skin) ? true : supported };
}

export function layoutSkinMath(
  tokens: MathToken[],
  skin: MathSkinDefinition,
  fontSize: number,
): SkinMathLayout {
  const scale = skinScale(skin, fontSize);
  const eqIndex = tokens.findIndex((t) => t.type === "char" && t.value === "=");
  const lhs = eqIndex >= 0 ? tokens.slice(0, eqIndex) : tokens;
  const eqToken = eqIndex >= 0 ? tokens[eqIndex] : null;
  const rhs = eqIndex >= 0 ? tokens.slice(eqIndex + 1) : [];

  const placed: PlacedGlyph[] = [];
  let cursor = 0;
  let supported = true;
  let height = fontSize * 1.4;

  const lhsLayout = layoutTokens(lhs, { skin, fontSize, scale });
  placed.push(...lhsLayout.glyphs.map((g) => ({ ...g, x: g.x + cursor })));
  cursor += lhsLayout.width;
  supported = supported && lhsLayout.supported;
  height = Math.max(height, lhsLayout.height);

  if (eqToken && eqToken.type === "char") {
    const eqLayout = layoutTokens([eqToken], { skin, fontSize, scale });
    placed.push(...eqLayout.glyphs.map((g) => ({ ...g, x: g.x + cursor })));
    cursor += eqLayout.width;
    supported = supported && eqLayout.supported;

    const rhsLayout = layoutTokens(rhs, { skin, fontSize, scale });
    placed.push(...rhsLayout.glyphs.map((g) => ({ ...g, x: g.x + cursor })));
    cursor += rhsLayout.width;
    supported = supported && rhsLayout.supported;
    height = Math.max(height, rhsLayout.height);
  }

  if (usesHybrid(skin)) {
    supported = true;
  }

  return { width: cursor, height, glyphs: placed, supported };
}
