/**
 * TypeScript mirror of ``app/schemas/infographics_schema.py`` plus legacy
 * typed shapes the renderer still supports for older rows.
 */

// =============================================================================
// Shared primitives
// =============================================================================

export interface DrawingStageBaseItem {
  id: string | number;
}

export interface DrawingStageText {
  text?: string | string[];
  fontWeight?: number;
  textAnchor?: "start" | "middle" | "end";
}

export interface DrawingStageAnimation {
  durationMs?: number;
  delayMs?: number;
}

// =============================================================================
// Flag-driven objects (frontend resolves layout)
// =============================================================================

/**
 * Flag-driven box (no `type` field). Frontend resolves x/y/width/height + animation.
 * See `components/visualEngine/objectConditions/boxCreation.tsx`.
 */
export interface DrawingStageBoxCreationObject extends DrawingStageBaseItem {
  BoxCreation: true;
  text?: string | string[];
  /** Code-map only: ties the box to a ``CodeDisplay.portions[]`` entry. */
  linkedPortion?: string;
  fontWeight?: number;
  textAnchor?: "start" | "middle" | "end";
}

/** Semantic grouping of code lines for highlight + explanation pairing. */
export interface CodePortion {
  id: string;
  /** Inclusive line index range into ``CodeDisplay.text``. */
  lines: [number, number];
  label?: string;
}

/**
 * Flag-driven code panel for ``code-map`` layout. AI supplies source lines
 * and portion groupings; the frontend computes highlight rects and positions
 * linked explanation boxes.
 */
export interface DrawingStageCodeDisplayObject extends DrawingStageBaseItem {
  CodeDisplay: true;
  language?: string;
  text?: string | string[];
  portions?: CodePortion[];
}

/** Flag-driven label with a fixed role preset in ``textCreation.tsx``. */
export interface DrawingStageTextCreationObject extends DrawingStageBaseItem {
  TextCreation: true;
  role: "code-title" | "objective" | "console";
  text?: string | string[];
  fontWeight?: number;
  textAnchor?: "start" | "middle" | "end";
}

// =============================================================================
// Legacy typed objects (AI-chosen coordinates — older payloads)
// =============================================================================

export interface DrawingStageRectangleObject extends DrawingStageBaseItem {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  padding?: number;
  text?: string | string[];
  fontSize?: number;
  lineHeight?: number;
  textColor?: string;
  fontWeight?: number;
  textAnchor?: "start" | "middle" | "end";
  animation?: DrawingStageAnimation;
}

export interface DrawingStageCircleObject extends DrawingStageBaseItem {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  animation?: DrawingStageAnimation;
}

export interface DrawingStageTextObject extends DrawingStageBaseItem {
  type: "text";
  x: number;
  y: number;
  text?: string | string[];
  fill?: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: number;
  textAnchor?: "start" | "middle" | "end";
  animation?: DrawingStageAnimation;
}

export interface DrawingStageLineObject extends DrawingStageBaseItem {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  animation?: DrawingStageAnimation;
}

// =============================================================================
// Object union + layout mode
// =============================================================================

export type DrawingStageObject =
  | DrawingStageBoxCreationObject
  | DrawingStageTextCreationObject
  | DrawingStageCodeDisplayObject
  | DrawingStageTextObject
  | DrawingStageRectangleObject
  | DrawingStageCircleObject
  | DrawingStageLineObject;

/** ``trunk`` is legacy; prefer ``math`` or ``science`` for non-code domains. */
export type DrawingStageLayoutMode = "trunk" | "code-map" | "math" | "science";

// =============================================================================
// Connections + free-form polylines
// =============================================================================

/** Flag-driven connector between two trunk ``BoxCreation`` ids. */
export interface DrawingStageConnection {
  id?: string | number;
  LineCreation: true;
  from: string | number;
  to: string | number;
}

/** Legacy hand-placed polyline (typed-coordinate mode). */
export interface DrawingStageLine {
  id: string | number;
  points?: Array<{ x: number; y: number }>;
  stroke?: string;
  strokeWidth?: number;
  animation?: DrawingStageAnimation;
}

// =============================================================================
// Root document
// =============================================================================

export interface DrawingStage {
  width: number;
  height: number;
  background?: string;
  /** Selects layout renderer. Defaults to trunk (horizontal step row). */
  layoutMode?: DrawingStageLayoutMode;
  objects: DrawingStageObject[];
  connections?: DrawingStageConnection[];
  /** Legacy typed-coordinate polylines (not flag-driven ``connections``). */
  lines?: DrawingStageLine[];
}

// =============================================================================
// Type guards
// =============================================================================

export function isBoxCreationItem(
  item: DrawingStageObject,
): item is DrawingStageBoxCreationObject {
  return (item as DrawingStageBoxCreationObject).BoxCreation === true;
}

export function isTextCreationItem(
  item: DrawingStageObject,
): item is DrawingStageTextCreationObject {
  return (item as DrawingStageTextCreationObject).TextCreation === true;
}

export function isCodeDisplayItem(
  item: DrawingStageObject,
): item is DrawingStageCodeDisplayObject {
  return (item as DrawingStageCodeDisplayObject).CodeDisplay === true;
}

/** True when the stage should use the code panel + portion highlight layout. */
export function isCodeMapStage(stage: DrawingStage): boolean {
  if (stage.layoutMode === "code-map") return true;
  return stage.objects.some(isCodeDisplayItem);
}

/** BoxCreation items that belong to the horizontal trunk row (no linkedPortion). */
export function isTrunkBoxItem(item: DrawingStageObject): boolean {
  return isBoxCreationItem(item) && !item.linkedPortion;
}

export function isLegacyRectangleItem(
  item: DrawingStageObject,
): item is DrawingStageRectangleObject {
  return (item as DrawingStageRectangleObject).type === "rectangle";
}

export function isLegacyTextItem(
  item: DrawingStageObject,
): item is DrawingStageTextObject {
  return (item as DrawingStageTextObject).type === "text";
}

export function isLegacyLineItem(
  item: DrawingStageObject,
): item is DrawingStageLineObject {
  return (item as DrawingStageLineObject).type === "line";
}

export function isLegacyCircleItem(
  item: DrawingStageObject,
): item is DrawingStageCircleObject {
  return (item as DrawingStageCircleObject).type === "circle";
}
