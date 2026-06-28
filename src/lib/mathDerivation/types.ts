/** Layer-2 math detail: how the previous step became this step (beat script). */

export type MathDerivationMotionKind =
  | "slide_right"
  | "slide_left"
  | "highlight"
  | "fade_in";

/** One clip inside a ``motion_stage`` animation box. */
export type MathDerivationMotionStep = {
  label?: string;
  expression: string;
  term?: string;
  motion: MathDerivationMotionKind;
};

export type MathDerivationTransition = {
  type: "arrow";
  direction: "down" | "right";
};

/** One timeline step — fades in sequentially (see mathDerivationTimeline). */
export type MathDerivationBeat =
  | { type: "note"; text: string }
  | { type: "expression"; text: string; id?: string }
  | { type: "arrow"; direction?: "down" | "right" }
  | { type: "explain"; text: string }
  | {
      type: "motion";
      /** Full equation/expression rendered with sticker SVGs for this beat only. */
      text: string;
      id?: string;
      /** Term to animate, e.g. "-x" or "x". Maps to consecutive sticker glyphs. */
      term: string;
      motion: MathDerivationMotionKind;
    }
  | {
      type: "motion_stage";
      id?: string;
      /** Optional sequential sticker clips (legacy); morph uses from/to/operation. */
      steps?: MathDerivationMotionStep[];
      /** Equation BEFORE this step (plain math). Falls back to surrounding beats. */
      from?: string;
      /** Equation AFTER this step (plain math). Falls back to surrounding beats. */
      to?: string;
      /** Optional explicit morph frames (plain math); overrides from/to. */
      frames?: string[];
      /** "Do the same to both sides" operation badge, e.g. "+x" or "-5". */
      operation?: string;
    };

/** @deprecated Prefer explicit ``beats`` — kept for older payloads. */
export type MathDerivationFrame = {
  id: string;
  note?: string;
  expression?: string;
  transition?: MathDerivationTransition;
};

export type MathStepDerivation = {
  fromStepId?: string;
  /** Ordered playback script — one entry = one fade-in beat. */
  beats?: MathDerivationBeat[];
  /** Legacy grouping; converted to beats when ``beats`` is omitted. */
  frames?: MathDerivationFrame[];
};
