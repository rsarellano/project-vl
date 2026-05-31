"use client";

import {
  CodePanelChrome,
  CodePanelLinesHtml,
  PortionHighlight,
} from "@/components/visualEngine/objectConditions/codeDisplay";
import CodeMapExplanation from "@/components/visualEngine/objectConditions/codeMapExplanation";
import CodeMapLineCreation from "@/components/visualEngine/objectConditions/codeMapLineCreation";
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
  const layout = resolveCodeMapLayout(stage);
  const themeObj = getTheme(theme);
  const panelTheme = getCodePanelTheme(theme);

  if (!layout) return null;

  const decorWidth = canvasWidth ?? layout.width;
  const decorHeight = canvasHeight ?? layout.height;
  const codeId = String(layout.codeDisplay.id);
  const { codePanel } = layout;

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

      {layout.explanations.map((explain) => (
        <CodeMapExplanation
          key={explain.id}
          explain={explain}
          portionIndex={explain.portionIndex}
          totalCount={layout.explanations.length}
          theme={theme}
        />
      ))}
    </>
  );
}
