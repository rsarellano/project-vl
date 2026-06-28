import type { MathStepDerivation } from "@/lib/mathDerivation/types";

/**
 * Reference beat scripts for API / prompt authors — attach as ``derivation`` on BoxCreation.
 * Production content comes from AI or deterministic backend builders, not the frontend.
 */
export const EXAMPLE_SIMPLIFY_BOTH_SIDES_DERIVATION: MathStepDerivation = {
  fromStepId: "step-2",
  beats: [
    { type: "note", text: "We start from the previous step." },
    { type: "expression", text: "(sqrt(2x+5))^2 = (x+1)^2", id: "b1" },
    { type: "arrow", direction: "down" },
    {
      type: "note",
      text: "This step simplifies each side — no squares or radicals left.",
    },
    {
      type: "explain",
      text: "The left side: squaring removed the radical — (sqrt(2x+5))^2 becomes 2x + 5.",
    },
    {
      type: "explain",
      text: "The right side: expand (x+1)^2 to x^2 + 2x + 1 using (a+b)^2 = a^2 + 2ab + b^2.",
    },
    { type: "arrow", direction: "down" },
    { type: "note", text: "After simplifying both sides:" },
    { type: "expression", text: "2x + 5 = x^2 + 2x + 1", id: "b2" },
  ],
};

/** Example — isolate square root (step 1): move extra term to the other side. */
export const EXAMPLE_ISOLATE_SQRT_DERIVATION: MathStepDerivation = {
  fromStepId: "problem",
  beats: [
    { type: "note", text: "We start from the original equation." },
    { type: "expression", text: "sqrt(2x+5) - x = 1", id: "b1" },
    { type: "arrow", direction: "down" },
    {
      type: "note",
      text: "This step isolates the square root on one side.",
    },
    {
      type: "explain",
      text: "Before we can square, the square root must stand alone on one side — nothing else added or subtracted beside it.",
    },
    {
      type: "explain",
      text: "The extra term on the left is in the way. We add it to both sides (property of equality) so it moves to the other side with the opposite sign.",
    },
    {
      type: "motion",
      text: "sqrt(2x+5) - x = 1",
      id: "mv-isolate",
      term: "-x",
      motion: "slide_right",
    },
    { type: "arrow", direction: "down" },
    { type: "note", text: "After isolating the square root:" },
    { type: "expression", text: "sqrt(2x+5) = x + 1", id: "b2" },
  ],
};

/** Example — square both sides (step 2): show BOTH sides in derivation. */
export const EXAMPLE_SQUARE_BOTH_SIDES_DERIVATION: MathStepDerivation = {
  fromStepId: "step-1",
  beats: [
    { type: "note", text: "We start from the previous step." },
    { type: "expression", text: "sqrt(2x+5) = x + 1", id: "b1" },
    { type: "arrow", direction: "down" },
    {
      type: "note",
      text: "This step squares both sides to remove the square root.",
    },
    {
      type: "explain",
      text: "The left side: squaring sqrt(2x+5) removes the radical and gives 2x + 5.",
    },
    {
      type: "explain",
      text: "The right side: squaring (x + 1) gives (x+1)^2.",
    },
    {
      type: "motion_stage",
      id: "stage-square",
      steps: [
        { label: "Left side", expression: "sqrt(2x+5)", motion: "highlight" },
        { label: "Right side", expression: "(x+1)^2", motion: "highlight" },
      ],
    },
    { type: "arrow", direction: "down" },
    { type: "note", text: "After squaring both sides:" },
    { type: "expression", text: "(sqrt(2x+5))^2 = (x+1)^2", id: "b2" },
  ],
};

/** Example — expand (x+1)^2 on the right side. */
export const EXAMPLE_EXPAND_RIGHT_SIDE_DERIVATION: MathStepDerivation = {
  fromStepId: "step-2",
  beats: [
    { type: "note", text: "We start from the previous step." },
    { type: "expression", text: "2x + 5 = (x+1)^2", id: "b1" },
    { type: "arrow", direction: "down" },
    { type: "note", text: "Expand the squared binomial on the right." },
    {
      type: "explain",
      text: "The left side is already simplified: 2x + 5.",
    },
    {
      type: "explain",
      text: "The right side: expand (x+1)^2 using (a+b)^2 = a^2 + 2ab + b^2 to get x^2 + 2x + 1.",
    },
    { type: "arrow", direction: "down" },
    { type: "note", text: "After expanding:" },
    { type: "expression", text: "2x + 5 = x^2 + 2x + 1", id: "b2" },
  ],
};
