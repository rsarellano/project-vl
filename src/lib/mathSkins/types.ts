/**
 * Math skins load one SVG sticker per character from `public/math-skins/<id>/`.
 * Hybrid skins fall back to KaTeX for glyphs not yet in `availableGlyphs`.
 */

export type MathSkinId = "default" | "chalkboard" | "stickers" | "anime" | "cartoon";

/** Subfolder names under `assetBasePath` for grouped glyph SVGs. */
export type GlyphFolderLayout = {
  digits: string;
  letters: string;
  operators: string;
  special: string;
};

export type MathSkinDefinition = {
  id: MathSkinId;
  label: string;
  /**
   * Filename prefix for glyphs in the skin folder.
   * e.g. "mathChalkboard" → mathChalkboardDigit9.svg
   */
  assetPrefix: string;
  /** Public URL base, e.g. "/math-skins/chalkboard" */
  assetBasePath: string;
  /** When set, glyphs load from subfolders (digits/, letters/, etc.). */
  glyphFolders?: GlyphFolderLayout;
  /** Override folder for composite assets (default: special/). */
  specialAssetFolders?: Partial<Record<"sqrtRadical", keyof GlyphFolderLayout>>;
  /** Default horizontal advance (px) when a glyph has no override. */
  defaultAdvance: number;
  /** Per-character advance overrides (key = single char). */
  glyphAdvance?: Partial<Record<string, number>>;
  /** Per-character vertical nudge in px at fontSize 20 (+ down, − up). */
  glyphVerticalOffset?: Partial<Record<string, number>>;
  /** Per-character rendered height in px at fontSize 20. */
  glyphHeight?: Partial<Record<string, number>>;
  unitScale: number;
  superscriptScale: number;
  superscriptRaise: number;
  /** Sqrt vinculum stroke color. */
  sqrtStrokeColor?: string;
  /**
   * When true, chars in `availableGlyphs` use SVG files; all others use KaTeX.
   * Lets you add glyphs one file at a time.
   */
  hybridGlyphs?: boolean;
  /** Characters that have an SVG file on disk (e.g. new Set(["5", "9"])). */
  availableGlyphs?: ReadonlySet<string>;
  /** KaTeX options for hybrid fallback characters. */
  katexFallback?: { chalk?: boolean };
  /**
   * When true, always render with KaTeX (ignore SVG assets).
   * Use for the default clean theme while sticker SVGs ship under another skin id.
   */
  katexOnly?: boolean;
  /** Placement for regular digit/letter stickers. */
  glyphLayout?: {
    /** Glyph box height in px at fontSize 20. */
    height?: number;
    /** Baseline anchor: image top = baseline - height * anchor. */
    baselineAnchor?: number;
  };
  /**
   * Square-root layout — fixed hook SVG + extendable vinculum stroke.
   */
  sqrtLayout?: {
    /** Must match hook-only `viewBox` width in `*SqrtRadical.svg`. */
    hookViewBoxWidth?: number;
    /** Must match hook-only `viewBox` height in `*SqrtRadical.svg`. */
    hookViewBoxHeight?: number;
    /** Rendered hook height in px at fontSize 20. */
    hookHeight?: number;
    /** Where the vinculum meets the hook: attach X / hook viewBox width. */
    barAttachXRatio?: number;
    /** Vinculum Y on the hook image: attach Y / hook viewBox height. */
    vinculumYRatio?: number;
    innerPadRight?: number;
    /** Horizontal bar thickness at fontSize 20 (default 1). */
    vinculumStrokeWidth?: number;
    /** Nudge sqrt hook down (+) or up (−) in px at fontSize 20. */
    verticalOffset?: number;
  };
};

export type MathToken =
  | { type: "char"; value: string }
  | { type: "group"; children: MathToken[] }
  | { type: "sqrt"; children: MathToken[] }
  | { type: "sup"; children: MathToken[] };

export type PlacedGlyphImage = {
  kind: "image";
  href: string;
  /** Source character (for `data-char` targeting and animations). */
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  preserveAspectRatio?: string;
};

export type PlacedGlyphKatex = {
  kind: "katex";
  html: string;
  x: number;
  y: number;
  width: number;
  height: number;
  chalk?: boolean;
};

export type PlacedGlyphStroke = {
  kind: "stroke";
  path: string;
  stroke: string;
  x: number;
  y: number;
  scale: number;
  /** Base stroke width before `scale` (default 1.8). */
  strokeWidth?: number;
};

export type PlacedGlyph = PlacedGlyphImage | PlacedGlyphStroke | PlacedGlyphKatex;

export type SkinMathLayout = {
  width: number;
  height: number;
  glyphs: PlacedGlyph[];
  supported: boolean;
};
