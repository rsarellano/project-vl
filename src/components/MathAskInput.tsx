"use client";

import MathExpressionPreview from "@/components/MathExpressionPreview";
import type { MathSkinId } from "@/lib/mathSkins";
import { looksLikeMathInput } from "@/lib/mathText";
import { useEffect, useRef, useState, type ClipboardEvent } from "react";

type MathAskInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPaste?: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  mathSkin?: MathSkinId;
  chalk?: boolean;
};

export default function MathAskInput({
  id,
  value,
  onChange,
  onPaste,
  placeholder,
  rows = 6,
  mathSkin,
  chalk = false,
}: MathAskInputProps) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showMath = looksLikeMathInput(value);
  const chalkStyled = chalk;

  useEffect(() => {
    setEditing(false);
  }, [value]);

  function openEditor() {
    setEditing(true);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }

  if (showMath && !editing) {
    return (
      <div
        className={
          chalkStyled
            ? "katex-chalk-preview shadow-sm"
            : "rounded-xl border border-slate-300 bg-white shadow-sm"
        }
      >
        <div className="flex min-h-[9.5rem] flex-col px-4 py-3">
          <div className="flex flex-1 items-center overflow-x-auto text-lg">
            <MathExpressionPreview
              expression={value.trim()}
              mathSkin={mathSkin}
              chalk={chalk}
              fontSize={20}
              className={chalkStyled ? "text-[#f2f2ea]" : "text-slate-900"}
            />
          </div>
          <button
            type="button"
            onClick={openEditor}
            className={
              chalkStyled
                ? "mt-2 self-start text-xs font-medium text-[#e8d060] hover:text-[#f5e6a8]"
                : "mt-2 self-start text-xs font-medium text-blue-600 hover:text-blue-800"
            }
          >
            Edit source
          </button>
        </div>
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          onBlur={() => setEditing(false)}
          rows={rows}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
      {showMath ? (
        <div
          className={
            chalkStyled
              ? "border-b border-[rgba(242,242,234,0.15)] px-4 py-2"
              : "border-b border-slate-100 px-4 py-2"
          }
        >
          <MathExpressionPreview
            expression={value.trim()}
            mathSkin={mathSkin}
            chalk={chalk}
            fontSize={16}
            className={chalkStyled ? "text-[#f2f2ea]" : "text-slate-900"}
          />
        </div>
      ) : null}
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        onBlur={() => setEditing(false)}
        rows={rows}
        placeholder={placeholder}
        className="min-h-[9.5rem] w-full resize-y rounded-xl border-0 bg-transparent px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      />
    </div>
  );
}
