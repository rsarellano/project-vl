import type { ReactNode } from "react";
import type { ResolvedBoxSpec } from "@/components/visualEngine/objectConditions/boxCreation";
import type { MathSkinId } from "@/lib/mathSkins";

/**
 * Theme system for the visual engine.
 *
 * A theme replaces the visual treatment of every BoxCreation while leaving
 * the layout (positions, sizes computed by `boxCreation.tsx`), the GSAP
 * timeline, the hover affordance, and the data contract with the AI all
 * untouched. Adding a new theme = drop a folder under `themes/` and add
 * one entry to `THEMES` in `themes/index.ts`.
 */

export type ThemeName = "default" | "cyberpunk" | "chalkboard";

/** Right-column detail panel styling for math layout stages. */
export type MathDetailReserveStyle = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  labelColor: string;
};

export type BoxStickerProps = {
  /** Layout-resolved spec from `resolveBoxSpec`. Position, size, default colors. */
  box: ResolvedBoxSpec;
  /** Zero-based index of this box in the trunk row. Useful for theme accents (e.g. "STEP_03"). */
  boxIndex: number;
  /** Total BoxCreation count for the stage; undefined when caller doesn't track it. */
  totalBoxCount: number | undefined;
  /** True when this is the final answer box. Themes typically render it with extra emphasis. */
  isAnswer: boolean;
  /** When true, equation-like lines render with KaTeX (math layout stages). */
  mathMode?: boolean;
  /** Per-character math sticker skin when `mathMode` is true. */
  mathSkin?: import("@/lib/mathSkins").MathSkinId;
};

/** Syntax token colors for the code-map ``CodeDisplay`` panel. */
export type CodeSyntaxPalette = {
  default: string;
  keyword: string;
  typeName: string;
  property: string;
  typeLiteral: string;
  string: string;
  number: string;
  punctuation: string;
  operator: string;
};

/** Visual treatment of the code-map source panel (background + syntax colors). */
export type CodePanelTheme = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  /** Corner radius of the code panel rect. */
  radius: number;
  /** Corner radius of portion highlight rects in code-map mode (defaults to layout constant). */
  highlightRadius?: number;
  labelColor: string;
  monoFont: string;
  syntax: CodeSyntaxPalette;
};

export type Theme = {
  name: ThemeName;
  /** Visible label for theme picker UIs. */
  label: string;
  /** Background color of the SVG canvas (applied as the rendered background fill). */
  canvasColor: string;
  /** Code-map panel styling (``CodeDisplay``). */
  codePanel: CodePanelTheme;
  /** KaTeX chalk colorization + grain (chalkboard theme). */
  mathChalk?: boolean;
  /**
   * Premium math skin — loads per-character SVGs from `public/math-skins/<id>/`.
   * Omit when using KaTeX only.
   */
  mathSkin?: MathSkinId;
  /** Math layout detail-column placeholder; falls back to global default when omitted. */
  mathDetailReserve?: MathDetailReserveStyle;
  /** Defs (gradients, filters, patterns) mounted once per stage. Return null when the theme needs none. */
  Defs: () => ReactNode;
  /**
   * Optional canvas-wide decoration rendered behind every BoxCreation.
   * Receives the actual rendered canvas dimensions (which can exceed
   * `stage.width / stage.height` when many boxes push the viewBox wider).
   */
  BackgroundDecor?: (props: { width: number; height: number }) => ReactNode;
  /** Renders one BoxCreation. Replaces the default `<rect>` + label entirely. */
  BoxSticker: (props: BoxStickerProps) => ReactNode;
};
