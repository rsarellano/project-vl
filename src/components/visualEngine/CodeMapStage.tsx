"use client";

import { useMemo, useState } from "react";
import {
  CodePanelChrome,
  CodePanelLinesHtml,
  PortionHighlight,
} from "@/components/visualEngine/objectConditions/codeDisplay";
import CodeMapExplanation from "@/components/visualEngine/objectConditions/codeConditions/codeMapExplanation";
import CodeMapLineCreation from "@/components/visualEngine/objectConditions/codeConditions/codeMapLineCreation";
import { resolveCodeMapLayout, CODE_HIGHLIGHT } from "@/components/visualEngine/layouts/codeMapLayout";
import { getCodePanelTheme, getTheme, type ThemeName } from "@/components/visualEngine/themes";
import type { DrawingStage } from "@/types/infographics";

type CodeMapStageProps = {
  stage: DrawingStage;
  theme?: ThemeName;
  canvasWidth?: number;
  canvasHeight?: number;
};

/** SVG content for ``layoutMode: "code-map"`` — code panel + portion highlights + explanations. */
export function CodeMapSvgContent({
  stage,
  theme,
  canvasWidth,
  canvasHeight,
}: CodeMapStageProps) {
  const [expandedExplainIds, setExpandedExplainIds] = useState<Record<string, boolean>>({});
  const layout = resolveCodeMapLayout(stage);
  const themeObj = getTheme(theme);
  const panelTheme = getCodePanelTheme(theme);

  if (!layout) return null;
  const portionById = useMemo(
    () => new Map(layout.portions.map((portion) => [portion.id, portion])),
    [layout.portions],
  );

  const decorWidth = canvasWidth ?? layout.width;
  const decorHeight = canvasHeight ?? layout.height;
  const codeId = String(layout.codeDisplay.id);
  const { codePanel } = layout;
  const explanationRenderOrder = [...layout.explanations].sort((a, b) => {
    const aExpanded = Boolean(expandedExplainIds[a.id]);
    const bExpanded = Boolean(expandedExplainIds[b.id]);
    if (aExpanded === bExpanded) return a.portionIndex - b.portionIndex;
    return aExpanded ? 1 : -1;
  });

  return (
    <>
      <themeObj.Defs />
      {themeObj.BackgroundDecor ? (
        <themeObj.BackgroundDecor width={decorWidth} height={decorHeight} />
      ) : (
        <rect width={decorWidth} height={decorHeight} fill={themeObj.canvasColor} />
      )}

      <g data-stage-id={codeId}>
        <CodePanelChrome
          codePanel={codePanel}
          panelTheme={panelTheme}
          language={codePanel.language}
        />

        {layout.portions.map((portion) => (
          <PortionHighlight
            key={portion.id}
            portion={portion}
            highlightRadius={panelTheme.highlightRadius ?? CODE_HIGHLIGHT.radius}
          />
        ))}

        <CodePanelLinesHtml
          codePanel={codePanel}
          panelTheme={panelTheme}
          lines={codePanel.lines}
        />
      </g>

      {layout.connections.map((connection) => (
        <CodeMapLineCreation key={connection.id} connection={connection} />
      ))}

      {explanationRenderOrder.map((explain) => (
        <CodeMapExplanation
          key={explain.id}
          explain={explain}
          linkedPortion={portionById.get(explain.linkedPortion)}
          codeLines={layout.codePanel.lines}
          expanded={Boolean(expandedExplainIds[explain.id])}
          onToggle={() =>
            setExpandedExplainIds((current) => ({
              ...current,
              [explain.id]: !current[explain.id],
            }))
          }
        />
      ))}
    </>
  );
}
