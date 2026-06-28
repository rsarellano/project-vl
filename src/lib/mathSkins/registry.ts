import { chalkboardMathSkin } from "./skins/chalkboard";
import { defaultMathSkin } from "./skins/default";
import { stickersMathSkin } from "./skins/stickers";
import type { MathSkinDefinition, MathSkinId } from "./types";

const SKINS: Partial<Record<MathSkinId, MathSkinDefinition>> = {
  default: defaultMathSkin,
  chalkboard: chalkboardMathSkin,
  stickers: stickersMathSkin,
  // anime: animeMathSkin,
  // cartoon: cartoonMathSkin,
};

export function getMathSkin(id: MathSkinId | undefined): MathSkinDefinition | null {
  if (!id) return null;
  return SKINS[id] ?? null;
}

export function getRegisteredMathSkinIds(): MathSkinId[] {
  return Object.keys(SKINS) as MathSkinId[];
}

export function registerMathSkin(skin: MathSkinDefinition): void {
  SKINS[skin.id] = skin;
}
