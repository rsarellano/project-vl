"use client";

import { useState, type FormEvent } from "react";
import MathDerivationScene from "@/components/visualEngine/objectConditions/MathDerivationScene";
import type { ThemeName } from "@/components/visualEngine/themes";
import type { MathStepDerivation } from "@/lib/mathDerivation/types";
import type { MathSkinId } from "@/lib/mathSkins/types";

export type MathDetailChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type MathDetailPanelContentProps = {
  stepLabel: string;
  theme?: ThemeName;
  mathSkin: MathSkinId;
  derivation: MathStepDerivation | null;
  messages: MathDetailChatMessage[];
  onAsk?: (question: string) => Promise<void>;
};

function panelChrome(theme: ThemeName | undefined) {
  const isChalk = theme === "chalkboard";
  return {
    isChalk,
    panel: isChalk
      ? "flex h-full min-h-0 flex-col text-[#f2f2ea]"
      : "flex h-full min-h-0 flex-col text-slate-900",
    sectionLabel: isChalk
      ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(242,242,234,0.45)]"
      : "text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500",
    explanationSection:
      "flex min-h-0 flex-[2] flex-col",
    explanationSlot: isChalk
      ? "min-h-0 flex-1 rounded-lg border border-dashed border-[rgba(242,242,234,0.2)] bg-[rgba(0,0,0,0.1)]"
      : "min-h-0 flex-1 rounded-lg border border-dashed border-slate-300 bg-slate-50/80",
    chatSection: `flex min-h-0 flex-[1] flex-col border-t pt-3 ${isChalk ? "border-[rgba(242,242,234,0.12)]" : "border-slate-200"}`,
    input: isChalk
      ? "w-full resize-none rounded-lg border border-[rgba(242,242,234,0.2)] bg-[rgba(0,0,0,0.18)] px-3 py-2 text-sm text-[#f2f2ea] placeholder:text-[rgba(242,242,234,0.35)] focus:border-[#e8d060] focus:outline-none focus:ring-1 focus:ring-[#e8d060]"
      : "w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
    button: isChalk
      ? "rounded-lg bg-[#e8d060] px-3 py-1.5 text-xs font-semibold text-[#243d32] transition hover:bg-[#f5e6a8] disabled:cursor-not-allowed disabled:opacity-45"
      : "rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45",
    userBubble: isChalk
      ? "rounded-lg bg-[rgba(242,242,234,0.08)] px-3 py-2 text-sm text-[#f2f2ea]"
      : "rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800",
    assistantBubble: isChalk
      ? "rounded-lg border border-[rgba(242,242,234,0.12)] bg-[rgba(0,0,0,0.14)] px-3 py-2 text-sm text-[#f2f2ea]"
      : "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800",
    hint: isChalk
      ? "text-[11px] text-[rgba(242,242,234,0.38)]"
      : "text-[11px] text-slate-500",
  };
}

/** HTML body embedded in the math detail panel (explanation slot + step chat). */
export default function MathDetailPanelContent({
  stepLabel,
  theme,
  mathSkin,
  derivation,
  messages,
  onAsk,
}: MathDetailPanelContentProps) {
  const submitEnabled = Boolean(onAsk);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const chrome = panelChrome(theme);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || !onAsk || loading) return;

    setLoading(true);
    setDraft("");
    try {
      await onAsk(question);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={chrome.panel}>
      <div className={chrome.explanationSection}>
        <p className={chrome.sectionLabel}>How we got here</p>
        <div
          data-math-step-explanation
          className={`${chrome.explanationSlot} mt-2 overflow-x-auto overflow-y-auto p-2`}
          aria-label={`Detailed explanation for ${stepLabel}`}
        >
          {derivation ? (
            <MathDerivationScene derivation={derivation} theme={theme} />
          ) : (
            <p className={`${chrome.hint} p-2`}>
              No derivation for this step yet. Regenerate the diagram — the AI should
              include <span className="font-medium">derivation.beats</span> on each step
              box that changes the math.
            </p>
          )}
        </div>
      </div>

      <div className={chrome.chatSection}>
        <p className={chrome.sectionLabel}>Ask about this step</p>
        <form onSubmit={handleSubmit} className="mt-2 shrink-0 space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            placeholder="Ask a follow-up question…"
            disabled={loading}
            className={chrome.input}
          />
          <div className="flex items-center justify-between gap-2">
            <p className={chrome.hint}>
              {submitEnabled
                ? "AI replies appear below."
                : "Type a question now — Ask activates when AI is connected."}
            </p>
            <button
              type="submit"
              disabled={!submitEnabled || loading || !draft.trim()}
              className={chrome.button}
            >
              {loading ? "Thinking…" : "Ask"}
            </button>
          </div>
        </form>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
          {messages.length ? (
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? chrome.userBubble
                      : chrome.assistantBubble
                  }
                >
                  {message.text}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
