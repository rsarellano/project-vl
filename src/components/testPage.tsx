"use client";

import { useState, useEffect } from "react";
import { Stage } from "@/components/visualEngine/Stage";
import { createAnswer } from "@/lib/api";
import type { InfographicBlueprint } from "@/types/infographics";

export default function TestPage() {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [question, setQuestion] = useState("");
  const [blueprint, setBlueprint] = useState<InfographicBlueprint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let animationInterval: NodeJS.Timeout;

    if (isPlaying) {
      animationInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 0.5;
        });
      }, 16);
    }

    return () => clearInterval(animationInterval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!blueprint) return;
    if (progress >= 100) {
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  async function handleAsk(e?: React.FormEvent) {
    e?.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await createAnswer(q);
      if (!data.blueprint) {
        throw new Error("Server returned no blueprint.");
      }
      setBlueprint(data.blueprint);
      setProgress(0);
      setIsPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden text-slate-900">
      <section className="w-2/3 flex flex-col p-6 border-r border-slate-200">
        <h1 className="text-2xl font-bold mb-4">Visual explanation</h1>

        <div className="flex-1 min-h-0 relative">
          {blueprint ? (
            <Stage blueprint={blueprint} progress={progress} />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 text-center px-6">
              Ask a question on the right. The diagram will appear here when the API
              returns an infographic blueprint.
            </div>
          )}
        </div>

        <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!blueprint}
            className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md text-xl disabled:opacity-40 disabled:pointer-events-none"
          >
            {isPlaying ? "⏸" : "▶️"}
          </button>

          <div className="flex-1">
            <label className="text-sm font-semibold mb-2 block">
              Timeline Progress: {Math.floor(progress)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              disabled={!blueprint}
              onChange={(e) => {
                setProgress(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full cursor-pointer accent-blue-600 disabled:opacity-40"
            />
          </div>
        </div>
      </section>

      <aside className="w-1/3 flex flex-col h-full bg-white p-6">
        <h2 className="text-xl font-bold mb-4">Ask &amp; explain</h2>

        <form onSubmit={handleAsk} className="flex flex-col gap-3 flex-1 min-h-0">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Describe a problem (e.g. train crossing a pole, speed and time known)..."
            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[120px]"
            rows={5}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? "Generating…" : "Generate diagram"}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col min-h-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Explanation</h3>
          <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 overflow-y-auto flex-1">
            {blueprint?.explanation ??
              "Your explanation text will show here after a successful generation."}
          </p>
        </div>
      </aside>
    </div>
  );
}
