"use client";

import type { HTMLAttributes } from "react";
import {
  CODE_HIGHLIGHT,
  CODE_MAP_LAYOUT,
  resolveCodeTextRegion,
  type ResolvedCodeMapLayout,
  type ResolvedPortionLayout,
} from "@/components/visualEngine/layouts/codeMapLayout";
import { tokenizeCodeLine } from "@/components/visualEngine/objectConditions/codeSyntaxHighlight";
import {
  getCodePanelTheme,
  type ThemeName,
} from "@/components/visualEngine/themes";
import type { CodePanelTheme } from "@/components/visualEngine/themes/types";
import type { DrawingStageCodeDisplayObject } from "@/types/infographics";

type CodeDisplayProps = {
  object: DrawingStageCodeDisplayObject;
  layout: ResolvedCodeMapLayout;
  theme?: ThemeName;
  wrapStageId?: boolean;
  showPanel?: boolean;
  showPortionHighlights?: boolean;
  showCodeText?: boolean;
};

export function PortionHighlight({
  portion,
  highlightRadius = CODE_HIGHLIGHT.radius,
}: {
  portion: ResolvedPortionLayout;
  highlightRadius?: number;
}) {
  const { highlight } = portion;
  return (
    <g data-stage-id={`portion-${portion.id}`} pointerEvents="none">
      <rect
        x={highlight.x}
        y={highlight.y}
        width={highlight.width}
        height={highlight.height}
        rx={highlightRadius}
        ry={highlightRadius}
        fill={CODE_HIGHLIGHT.fill}
        stroke={CODE_HIGHLIGHT.stroke}
        strokeWidth={CODE_HIGHLIGHT.strokeWidth}
      />
    </g>
  );
}

/** Panel background + language label (SVG — always aligned with layout math). */
export function CodePanelChrome({
  codePanel,
  panelTheme,
  language,
}: {
  codePanel: ResolvedCodeMapLayout["codePanel"];
  panelTheme: CodePanelTheme;
  language: string;
}) {
  const { codePadding, codeLabelFontSize, codeLabelLineHeight } = CODE_MAP_LAYOUT;
  const textX = codePanel.x + codePadding;

  return (
    <>
      <rect
        x={codePanel.x}
        y={codePanel.y}
        width={codePanel.width}
        height={codePanel.height}
        rx={panelTheme.radius}
        ry={panelTheme.radius}
        fill={panelTheme.fill}
        stroke={panelTheme.stroke}
        strokeWidth={panelTheme.strokeWidth}
      />
      <text
        x={textX}
        y={codePanel.y + codePadding + codeLabelLineHeight}
        fill={panelTheme.labelColor}
        fontSize={codeLabelFontSize}
        fontWeight={600}
        fontFamily={panelTheme.monoFont}
        letterSpacing="0.06em"
        dominantBaseline="alphabetic"
      >
        {language.toUpperCase()}
      </text>
    </>
  );
}

/** Syntax-colored code lines — transparent background, sits on top of highlights. */
export function CodePanelLinesHtml({
  codePanel,
  panelTheme,
  lines,
}: {
  codePanel: ResolvedCodeMapLayout["codePanel"];
  panelTheme: CodePanelTheme;
  lines: string[];
}) {
  const { codeLineHeight, codeFontSize } = CODE_MAP_LAYOUT;
  const { textStartY, textX, textWidth, textHeight } =
    resolveCodeTextRegion(codePanel);

  return (
    <foreignObject
      x={textX}
      y={textStartY}
      width={textWidth}
      height={textHeight}
    >
      <div
        {...({
          xmlns: "http://www.w3.org/1999/xhtml",
          style: {
            margin: 0,
            padding: 0,
            background: "transparent",
            fontFamily: panelTheme.monoFont,
            fontSize: codeFontSize,
          },
        } as HTMLAttributes<HTMLDivElement> & { xmlns: string })}
      >
        {lines.map((line, index) => (
          <div
            key={`code-line-${index}`}
            style={{
              height: codeLineHeight,
              lineHeight: `${codeLineHeight}px`,
              margin: 0,
              padding: 0,
              whiteSpace: "pre",
              overflow: "hidden",
            }}
          >
            {tokenizeCodeLine(line, panelTheme.syntax).map((token, tokenIndex) => (
              <span
                key={`code-line-${index}-tok-${tokenIndex}`}
                style={{ color: token.color }}
              >
                {token.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </foreignObject>
  );
}

export default function CodeDisplay({
  object,
  layout,
  theme,
  wrapStageId = true,
  showPanel = true,
  showPortionHighlights = true,
  showCodeText = true,
}: CodeDisplayProps) {
  const { codePanel, portions } = layout;
  const panelTheme = getCodePanelTheme(theme);

  const content = (
    <>
      {showPanel ? (
        <CodePanelChrome
          codePanel={codePanel}
          panelTheme={panelTheme}
          language={codePanel.language}
        />
      ) : null}

      {showPortionHighlights
        ? portions.map((portion) => (
            <PortionHighlight
              key={portion.id}
              portion={portion}
              highlightRadius={panelTheme.highlightRadius ?? CODE_HIGHLIGHT.radius}
            />
          ))
        : null}

      {showCodeText ? (
        <CodePanelLinesHtml
          codePanel={codePanel}
          panelTheme={panelTheme}
          lines={codePanel.lines}
        />
      ) : null}
    </>
  );

  if (!wrapStageId) {
    return content;
  }

  return <g data-stage-id={String(object.id)}>{content}</g>;
}
