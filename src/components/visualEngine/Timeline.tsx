"use client";

type TimelineProps = {
  timeMs: number;
  onReplay: () => void;
  onDownloadSvg?: () => void;
};

export function Timeline({ timeMs, onReplay, onDownloadSvg }: TimelineProps) {
  const seconds = (timeMs / 1000).toFixed(1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onReplay}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Replay
      </button>
      <span className="text-xs tabular-nums text-slate-500">{seconds}s</span>
      {onDownloadSvg ? (
        <button
          type="button"
          onClick={onDownloadSvg}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Download SVG
        </button>
      ) : null}
    </div>
  );
}
