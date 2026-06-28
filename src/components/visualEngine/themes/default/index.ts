import type { Theme } from "../types";
import { DefaultBoxSticker } from "./BoxSticker";
import { DefaultBackgroundDecor } from "./BackgroundDecor";
import { DefaultDefs } from "./SharedDefs";
import { defaultCodePanelTheme } from "./codePanel";

export const defaultTheme: Theme = {
  name: "default",
  label: "Default (clean)",
  canvasColor: "#ffffff",
  codePanel: defaultCodePanelTheme,
  mathSkin: "default",
  Defs: DefaultDefs,
  BackgroundDecor: DefaultBackgroundDecor,
  BoxSticker: DefaultBoxSticker,
};
