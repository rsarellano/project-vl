"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { setDrawingStageEndState } from "@/components/visualEngine/drawingStageTimeline";
import { Stage, type StageHandle } from "@/components/visualEngine/Stage";
import { ThemeSelect } from "@/components/visualEngine/ThemeSelect";
import type { ThemeName } from "@/components/visualEngine/themes";
import { Timeline } from "@/components/visualEngine/Timeline";
import { getTwoSumCodeMapStage } from "@/components/visualEngine/samples/twoSumCodeMapStage";
import { createAnswer, fetchTwoSumSampleStage } from "@/lib/api";
import type { UserLearningPreferences } from "@/lib/userPreferences";
import type { DrawingStage } from "@/types/infographics";

type TestPageProps = {
  preferences?: UserLearningPreferences | null;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
};

const DIAGRAM_ZOOM_MIN = 0.5;
const DIAGRAM_ZOOM_MAX = 3;
const DIAGRAM_ZOOM_STEP = 0.15;

export default function TestPage({ preferences, theme, onThemeChange }: TestPageProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawingStage, setDrawingStage] = useState<DrawingStage | null>(null);
  const [questionType, setQuestionType] = useState<string | null>(null);
  const [diagramZoom, setDiagramZoom] = useState(1);
  const [playKey, setPlayKey] = useState(0);
  const [narrationMs, setNarrationMs] = useState(0);

  const stageRef = useRef<StageHandle>(null);
  const diagramScrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const el = diagramScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      setDiagramZoom((z) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const next =
          Math.round(
            Math.min(DIAGRAM_ZOOM_MAX, Math.max(DIAGRAM_ZOOM_MIN, z * factor)) *
              100,
          ) / 100;
        if (next !== z) {
          const ratio = next / z;
          pendingScrollRef.current = {
            left: (el.scrollLeft + pointerX) * ratio - pointerX,
            top: (el.scrollTop + pointerY) * ratio - pointerY,
          };
        }
        return next;
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [drawingStage]);

  useLayoutEffect(() => {
    const el = diagramScrollRef.current;
    const pending = pendingScrollRef.current;
    if (el && pending) {
      el.scrollLeft = pending.left;
      el.scrollTop = pending.top;
      pendingScrollRef.current = null;
    }
  }, [diagramZoom]);

  async function handleAsk(e?: FormEvent) {
    e?.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await createAnswer(q, preferences);
      if (!data.stage) {
        throw new Error("Server returned no drawing stage.");
      }
      setDrawingStage(data.stage ?? null);
      setQuestionType(data.question_type ?? null);
      setDiagramZoom(1);
      setPlayKey((k) => k + 1);
      setNarrationMs(0);
    } catch (err) {
      setQuestionType(null);
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTwoSumSample() {
    setError(null);
    setLoading(true);
    try {
      let stage: DrawingStage;
      try {
        stage = await fetchTwoSumSampleStage();
      } catch {
        stage = getTwoSumCodeMapStage();
      }
      setQuestion("Two Sum — hash map approach (code map sample)");
      setQuestionType("coding.code_solution (sample)");
      setDrawingStage(stage);
      setDiagramZoom(1);
      setPlayKey((k) => k + 1);
      setNarrationMs(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sample.");
    } finally {
      setLoading(false);
    }
  }

  const replayDiagram = () => {
    stageRef.current?.replay();
  };

  const downloadSvg = () => {
    const svg = document.getElementById("drawing-stage-svg") as SVGSVGElement | null;
    if (!svg || !drawingStage) return;

    setDrawingStageEndState(svg, drawingStage);

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drawing-stage.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100 lg:flex-row">
      {/* Left: ask form + playback controls */}
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-[min(100%,420px)] lg:border-b-0 lg:border-r">
        <form
          onSubmit={handleAsk}
          className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4"
        >
          <label className="text-sm font-medium text-slate-700" htmlFor="question">
            Ask a question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={6}
            placeholder="Trace this while loop… or paste code to explain…"
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40"
            >
              {loading ? "Generating…" : "Generate diagram"}
            </button>
            <button
              type="button"
              onClick={loadTwoSumSample}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
            >
              Load Two Sum sample
            </button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {questionType ? (
            <p className="text-xs text-slate-500">Classifier: {questionType}</p>
          ) : null}
        </form>

        <div className="flex flex-col gap-3 px-4 py-4">
          <ThemeSelect
            id="ask-form-theme"
            value={theme}
            onChange={onThemeChange}
          />
          {drawingStage ? (
            <Timeline
              timeMs={narrationMs}
              onReplay={replayDiagram}
              onDownloadSvg={downloadSvg}
            />
          ) : (
            <p className="text-sm text-slate-500">
              Generate a diagram or load the Two Sum sample to preview the visual
              engine.
            </p>
          )}
        </div>
      </aside>

      {/* Right: drawing stage */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4">
        {drawingStage ? (
          <>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <ThemeSelect
                id="diagram-toolbar-theme"
                value={theme}
                onChange={onThemeChange}
              />
              <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
              <button
                type="button"
                onClick={() =>
                  setDiagramZoom((z) =>
                    Math.max(
                      DIAGRAM_ZOOM_MIN,
                      Math.round((z - DIAGRAM_ZOOM_STEP) * 100) / 100,
                    ),
                  )
                }
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="min-w-12 text-center text-xs tabular-nums text-slate-600">
                {Math.round(diagramZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setDiagramZoom((z) =>
                    Math.min(
                      DIAGRAM_ZOOM_MAX,
                      Math.round((z + DIAGRAM_ZOOM_STEP) * 100) / 100,
                    ),
                  )
                }
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            <div
              ref={diagramScrollRef}
              className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50/80 shadow-inner"
            >
              <Stage
                ref={stageRef}
                drawingStage={drawingStage}
                playKey={playKey}
                onTimeUpdate={setNarrationMs}
                theme={theme}
                zoom={diagramZoom}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500">
            Your diagram will appear here after you generate or load a sample.
          </div>
        )}
      </div>
    </div>
  );
}
