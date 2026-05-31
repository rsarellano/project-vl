import { BOX_DEFAULTS } from "@/components/visualEngine/objectConditions/boxCreation";
import type {
  CodePortion,
  DrawingStage,
  DrawingStageBoxCreationObject,
  DrawingStageCodeDisplayObject,
} from "@/types/infographics";
import { isBoxCreationItem, isCodeDisplayItem } from "@/types/infographics";

/**
 * Layout math for ``code-map`` mode: code panel on the left, highlighted
 * portions, explanation boxes on the right, horizontal connectors between them.
 */

export const CODE_MAP_LAYOUT = {
  originX: 56,
  originY: 56,
  codePanelWidth: 540,
  codePadding: 24,
  /** Vertical space reserved for the language label above the code lines. */
  codeHeaderHeight: 32,
  codeLineHeight: 36,
  codeFontSize: 13,
  /** Language label above the code block (must match ``codeDisplay`` HTML). */
  codeLabelFontSize: 11,
  codeLabelLineHeight: 14,
  /** Inset around each portion highlight so it frames the line without covering glyphs. */
  highlightPadX: 10,
  highlightPadY: 6,
  /** Gap between code panel right edge and explanation boxes. */
  explainGap: 112,
  explainBoxWidth: 268,
  explainPadding: 18,
  explainLineHeight: 16,
  explainMinHeight: 80,
  /** Minimum vertical gap between stacked explanation boxes. */
  explainMinGap: 10,
  /** Distance left of explanation boxes where connector elbows turn vertical. */
  connectorApproachGap: 28,
  /** Inset from code panel / explain column when distributing connector lanes. */
  connectorLaneInset: 12,
  /** Straight connector when highlight and box centers differ by less than this. */
  connectorStraightTolerance: 6,
  endMargin: 56,
  bottomMargin: 56,
} as const;

export const CODE_MAP_ANIMATION = {
  panelDurationMs: 500,
  portionDurationMs: 450,
  explainDurationMs: 550,
  lineDurationMs: 700,
  stepDelayMs: 900,
  lineDelayAfterExplainMs: 200,
} as const;

export const CODE_HIGHLIGHT = {
  /** Light tint only — text always renders on top of highlights. */
  fill: "rgba(251, 191, 36, 0.08)",
  stroke: "#fbbf24",
  strokeWidth: 1.5,
  radius: 6,
  labelColor: "#fbbf24",
} as const;

/** Portion name (Setup, Scan, …) rendered above each explanation box. */
export const EXPLAIN_LABEL = {
  fontSize: 11,
  fontWeight: 600,
  /** Distance above the top edge of the explanation box. */
  offsetY: 14,
  color: CODE_HIGHLIGHT.labelColor,
  monoFont: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
} as const;

export const CODE_PANEL = {
  /** @deprecated Use ``getTheme(name).codePanel`` — kept for layout fallbacks only. */
  fill: "#1e1e1e",
  stroke: "#3c3c3c",
  strokeWidth: 1,
  radius: 8,
  textColor: "#d4d4d4",
  labelColor: "#858585",
  monoFont: '"JetBrains Mono", "Fira Code", "Consolas", "Courier New", monospace',
} as const;

export type CodeMapExplanationObject = DrawingStageBoxCreationObject & {
  linkedPortion: string;
};

export type ResolvedPortionLayout = CodePortion & {
  highlight: { x: number; y: number; width: number; height: number };
  explainBoxId: string | null;
};

export type ResolvedExplainLayout = {
  id: string;
  linkedPortion: string;
  /** Human-readable portion name shown above the explanation box (e.g. "Setup"). */
  portionLabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
  text?: string | string[];
  portionIndex: number;
  animation: { durationMs: number; delayMs: number };
};

export type ResolvedCodeMapConnection = {
  id: string;
  from: string;
  to: string;
  points: Array<{ x: number; y: number }>;
  animation: { durationMs: number; delayMs: number };
};

export type ResolvedCodeMapLayout = {
  codeDisplay: DrawingStageCodeDisplayObject;
  codePanel: {
    x: number;
    y: number;
    width: number;
    height: number;
    lines: string[];
    language: string;
  };
  portions: ResolvedPortionLayout[];
  explanations: ResolvedExplainLayout[];
  connections: ResolvedCodeMapConnection[];
  width: number;
  height: number;
};

function getTextLines(text: string | string[] | undefined): string[] {
  if (!text) return [];
  return Array.isArray(text) ? text : [text];
}

/** Correct AI payloads that use 1-based line numbers instead of 0-based indices. */
function normalizePortionLineIndices(
  portions: CodePortion[],
  lineCount: number,
): CodePortion[] {
  if (!portions.length || lineCount <= 0) return portions;

  const starts = portions.map((portion) => portion.lines[0]);
  const minStart = Math.min(...starts);
  const maxEnd = Math.max(...portions.map((portion) => portion.lines[1]));

  const looksOneBased =
    minStart >= 1 &&
    maxEnd <= lineCount &&
    !starts.includes(0);

  if (!looksOneBased) return portions;

  return portions.map((portion) => ({
    ...portion,
    lines: [portion.lines[0] - 1, portion.lines[1] - 1] as [number, number],
  }));
}

export function getCodeDisplayObject(
  objects: DrawingStage["objects"],
): DrawingStageCodeDisplayObject | null {
  return objects.find(isCodeDisplayItem) ?? null;
}

export function getCodeMapExplanationObjects(
  objects: DrawingStage["objects"],
): CodeMapExplanationObject[] {
  return objects.filter(
    (obj): obj is CodeMapExplanationObject =>
      isBoxCreationItem(obj) && typeof obj.linkedPortion === "string",
  );
}

function resolveExplainHeight(text: string | string[] | undefined): number {
  const lines = getTextLines(text);
  const { explainPadding, explainLineHeight, explainMinHeight } = CODE_MAP_LAYOUT;
  return Math.max(
    explainMinHeight,
    lines.length * explainLineHeight + explainPadding * 2,
  );
}

function codeLineTop(textStartY: number, lineIndex: number): number {
  return textStartY + lineIndex * CODE_MAP_LAYOUT.codeLineHeight;
}

/** Shared origin for code lines — must match ``codeDisplay`` HTML/foreignObject layout. */
export function resolveCodeTextRegion(
  codePanel: ResolvedCodeMapLayout["codePanel"],
): {
  textStartY: number;
  textX: number;
  textWidth: number;
  textHeight: number;
} {
  const { codePadding, codeLineHeight } = CODE_MAP_LAYOUT;
  const textStartY = codePanel.y + codePadding + CODE_MAP_LAYOUT.codeHeaderHeight;

  return {
    textStartY,
    textX: codePanel.x + codePadding,
    textWidth: codePanel.width - codePadding * 2,
    textHeight: codePanel.lines.length * codeLineHeight,
  };
}

function resolvePortionHighlight(
  lineStart: number,
  lineEnd: number,
  codePanel: ResolvedCodeMapLayout["codePanel"],
): { x: number; y: number; width: number; height: number } {
  const { codePadding, codeLineHeight, highlightPadX, highlightPadY } =
    CODE_MAP_LAYOUT;
  const topLine = Math.min(lineStart, lineEnd);
  const bottomLine = Math.max(lineStart, lineEnd);

  const { textStartY } = resolveCodeTextRegion(codePanel);
  const topY = codeLineTop(textStartY, topLine) + highlightPadY;
  const bottomY =
    codeLineTop(textStartY, bottomLine) + codeLineHeight - highlightPadY;

  return {
    x: codePanel.x + codePadding - highlightPadX,
    y: topY,
    width: codePanel.width - codePadding * 2 + highlightPadX * 2,
    height: bottomY - topY,
  };
}

function explainLabelClearance(): number {
  return EXPLAIN_LABEL.offsetY + EXPLAIN_LABEL.fontSize + 6;
}

type ExplainLayoutDraft = {
  explain: CodeMapExplanationObject;
  portion: ResolvedPortionLayout;
  portionIndex: number;
  height: number;
  idealY: number;
};

/**
 * Stack explanation boxes in teaching order, anchored to each highlight row.
 * Only nudge downward when boxes would overlap — labels sit above each box so
 * they do not consume vertical gap between boxes.
 */
function resolveExplanationPositions(
  drafts: ExplainLayoutDraft[],
  explainX: number,
  minTopY: number,
): ResolvedExplainLayout[] {
  const { explainBoxWidth, explainPadding, explainMinGap } = CODE_MAP_LAYOUT;
  const sorted = [...drafts].sort((a, b) => a.portionIndex - b.portionIndex);

  let cursorY = minTopY;
  const resolved: ResolvedExplainLayout[] = [];

  for (const draft of sorted) {
    const y = Math.max(draft.idealY, cursorY);
    resolved.push({
      id: String(draft.explain.id),
      linkedPortion: draft.portion.id,
      portionLabel: draft.portion.label,
      x: explainX,
      y,
      width: explainBoxWidth,
      height: draft.height,
      padding: explainPadding,
      text: draft.explain.text,
      portionIndex: draft.portionIndex,
      animation: {
        durationMs: CODE_MAP_ANIMATION.explainDurationMs,
        delayMs:
          CODE_MAP_ANIMATION.stepDelayMs * draft.portionIndex +
          CODE_MAP_ANIMATION.panelDurationMs,
      },
    });
    cursorY = y + draft.height + explainMinGap;
  }

  return resolved;
}

/**
 * Spread elbow columns across the gap so vertical legs do not stack on one X.
 */
function resolveConnectorElbowX(
  codePanelRight: number,
  explainLeft: number,
  laneIndex: number,
  laneCount: number,
): number {
  const { connectorApproachGap, connectorLaneInset } = CODE_MAP_LAYOUT;

  if (laneCount <= 1) {
    return explainLeft - connectorApproachGap;
  }

  const minX = codePanelRight + connectorLaneInset;
  const maxX = explainLeft - connectorLaneInset;
  const step = (maxX - minX) / Math.max(laneCount - 1, 1);

  return minX + laneIndex * step;
}

/**
 * Route each connector from its own highlight row, then turn vertical in a
 * dedicated lane near the explanation column.
 */
function resolveConnectorPoints(
  highlight: { x: number; y: number; width: number; height: number },
  explain: { x: number; y: number; width: number; height: number },
  laneIndex: number,
  laneCount: number,
  codePanelRight: number,
): Array<{ x: number; y: number }> {
  const { connectorStraightTolerance } = CODE_MAP_LAYOUT;
  const fromX = highlight.x + highlight.width;
  const fromY = highlight.y + highlight.height / 2;
  const toX = explain.x;
  const toY = explain.y + explain.height / 2;
  const elbowX = resolveConnectorElbowX(codePanelRight, toX, laneIndex, laneCount);

  if (Math.abs(fromY - toY) <= connectorStraightTolerance) {
    return [
      { x: fromX, y: fromY },
      { x: toX, y: toY },
    ];
  }

  return [
    { x: fromX, y: fromY },
    { x: elbowX, y: fromY },
    { x: elbowX, y: toY },
    { x: toX, y: toY },
  ];
}

/** Compute every spatial value for a code-map stage. */
export function resolveCodeMapLayout(stage: DrawingStage): ResolvedCodeMapLayout | null {
  const codeDisplay = getCodeDisplayObject(stage.objects);
  if (!codeDisplay) return null;

  const lines = getTextLines(codeDisplay.text);
  const portions = normalizePortionLineIndices(
    codeDisplay.portions ?? [],
    lines.length,
  );
  const explanations = getCodeMapExplanationObjects(stage.objects);
  const explainByPortion = new Map(
    explanations.map((obj) => [obj.linkedPortion, obj]),
  );

  const { originX, originY, codePanelWidth, codePadding, codeLineHeight, codeHeaderHeight, explainGap, endMargin, bottomMargin } =
    CODE_MAP_LAYOUT;

  const codePanel = {
    x: originX,
    y: originY,
    width: codePanelWidth,
    height: codePadding * 2 + lines.length * codeLineHeight + codeHeaderHeight + 8,
    lines,
    language: codeDisplay.language ?? "javascript",
  };

  const resolvedPortions: ResolvedPortionLayout[] = portions.map((portion) => {
    const [lineStart, lineEnd] = portion.lines;
    const explain = explainByPortion.get(portion.id);
    return {
      ...portion,
      highlight: resolvePortionHighlight(lineStart, lineEnd, codePanel),
      explainBoxId: explain ? String(explain.id) : null,
    };
  });

  const explainX = codePanel.x + codePanel.width + explainGap;
  const explainDrafts: ExplainLayoutDraft[] = [];

  resolvedPortions.forEach((portion, portionIndex) => {
    const explain = explainByPortion.get(portion.id);
    if (!explain) return;

    const height = resolveExplainHeight(explain.text);
    const idealY =
      portion.highlight.y + portion.highlight.height / 2 - height / 2;

    explainDrafts.push({
      explain,
      portion,
      portionIndex,
      height,
      idealY,
    });
  });

  const minExplainTopY = codePanel.y - explainLabelClearance();
  const resolvedExplanations = resolveExplanationPositions(
    explainDrafts,
    explainX,
    minExplainTopY,
  );

  const explainById = new Map(resolvedExplanations.map((e) => [e.id, e]));
  const codePanelRight = codePanel.x + codePanel.width;
  const linkedPortions = resolvedPortions.filter((portion) => portion.explainBoxId);
  const laneCount = linkedPortions.length;

  const connections: ResolvedCodeMapConnection[] = [];

  for (const portion of linkedPortions) {
    const toExplain = explainById.get(portion.explainBoxId!);
    if (!toExplain || toExplain.linkedPortion !== portion.id) continue;

    connections.push({
      id: `${portion.id}-to-${toExplain.id}`,
      from: portion.id,
      to: toExplain.id,
      points: resolveConnectorPoints(
        portion.highlight,
        toExplain,
        toExplain.portionIndex,
        laneCount,
        codePanelRight,
      ),
      animation: {
        durationMs: CODE_MAP_ANIMATION.lineDurationMs,
        delayMs:
          toExplain.animation.delayMs + CODE_MAP_ANIMATION.lineDelayAfterExplainMs,
      },
    });
  }

  const rightEdge = Math.max(
    codePanel.x + codePanel.width,
    ...resolvedExplanations.map((e) => e.x + e.width),
  );
  const bottomEdge = Math.max(
    codePanel.y + codePanel.height,
    ...resolvedExplanations.map((e) => e.y + e.height),
    ...resolvedPortions.map((p) => p.highlight.y + p.highlight.height),
  );

  return {
    codeDisplay,
    codePanel,
    portions: resolvedPortions,
    explanations: resolvedExplanations,
    connections,
    width: rightEdge + endMargin,
    height: bottomEdge + bottomMargin,
  };
}

export function computeCodeMapViewBox(stage: DrawingStage): { width: number; height: number } {
  const layout = resolveCodeMapLayout(stage);
  if (!layout) {
    return { width: stage.width, height: stage.height };
  }
  return {
    width: Math.max(stage.width, layout.width),
    height: Math.max(stage.height, layout.height),
  };
}

export function getCodeMapAnimationEntries(stage: DrawingStage): {
  fades: Array<{ id: string; animation: { durationMs: number; delayMs: number } }>;
  lines: Array<{ id: string; animation: { durationMs: number; delayMs: number } }>;
} {
  const layout = resolveCodeMapLayout(stage);
  if (!layout) return { fades: [], lines: [] };

  const fades: Array<{ id: string; animation: { durationMs: number; delayMs: number } }> = [
    {
      id: String(layout.codeDisplay.id),
      animation: { durationMs: CODE_MAP_ANIMATION.panelDurationMs, delayMs: 0 },
    },
  ];

  layout.explanations.forEach((explain) => {
    fades.push({ id: explain.id, animation: explain.animation });
  });

  const lines: Array<{ id: string; animation: { durationMs: number; delayMs: number } }> =
    layout.connections.map((connection) => ({
      id: connection.id,
      animation: connection.animation,
    }));

  return { fades, lines };
}

/** Build a ResolvedBoxSpec-compatible object for theme BoxSticker rendering. */
export function toExplainBoxSpec(explain: ResolvedExplainLayout) {
  return {
    id: explain.id,
    text: explain.text,
    x: explain.x,
    y: explain.y,
    width: explain.width,
    height: explain.height,
    padding: explain.padding,
    animation: explain.animation,
    radius: BOX_DEFAULTS.radius,
    fill: BOX_DEFAULTS.fill,
    stroke: BOX_DEFAULTS.stroke,
    strokeWidth: BOX_DEFAULTS.strokeWidth,
    fontSize: BOX_DEFAULTS.fontSize,
    lineHeight: CODE_MAP_LAYOUT.explainLineHeight,
    textColor: BOX_DEFAULTS.textColor,
  };
}
