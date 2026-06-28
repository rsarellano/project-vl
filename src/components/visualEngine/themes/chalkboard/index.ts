import type { Theme } from "../types";
import { ChalkboardBackgroundDecor } from "./BackgroundDecor";
import { ChalkboardBoxSticker } from "./BoxSticker";
import { ChalkboardDefs } from "./SharedDefs";
import { chalkboardCodePanelTheme } from "./codePanel";
import { CHALKBOARD_MATH_DETAIL, CHALKBOARD_TOKENS } from "./tokens";

export const chalkboardTheme: Theme = {
  name: "chalkboard",
  label: "Chalkboard",
  canvasColor: CHALKBOARD_TOKENS.canvas,
  codePanel: chalkboardCodePanelTheme,
  mathChalk: true,
  mathSkin: "chalkboard",
  mathDetailReserve: CHALKBOARD_MATH_DETAIL,
  Defs: ChalkboardDefs,
  BackgroundDecor: ChalkboardBackgroundDecor,
  BoxSticker: ChalkboardBoxSticker,
};
