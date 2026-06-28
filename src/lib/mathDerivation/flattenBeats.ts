import type {
  MathDerivationBeat,
  MathDerivationFrame,
  MathStepDerivation,
} from "@/lib/mathDerivation/types";

/** Turn legacy ``frames`` into a flat beat list (note → expr → arrow → …). */
export function framesToBeats(frames: MathDerivationFrame[]): MathDerivationBeat[] {
  const beats: MathDerivationBeat[] = [];

  for (const frame of frames) {
    if (frame.note) {
      beats.push({ type: "note", text: frame.note });
    }
    if (frame.expression) {
      beats.push({ type: "expression", text: frame.expression, id: frame.id });
    }
    if (frame.transition?.type === "arrow") {
      beats.push({
        type: "arrow",
        direction: frame.transition.direction ?? "down",
      });
    }
  }

  return beats;
}

/** Prefer explicit ``beats``; otherwise flatten ``frames``. */
export function resolveDerivationBeats(
  derivation: MathStepDerivation,
): MathDerivationBeat[] {
  if (derivation.beats?.length) {
    return derivation.beats;
  }
  if (derivation.frames?.length) {
    return framesToBeats(derivation.frames);
  }
  return [];
}
