"use client";

import Link from "next/link";
import { ScrollRevealSection } from "@/components/home/ScrollRevealSection";
import { useAuth } from "@/components/providers/AuthProvider";

const PLACEHOLDER_BOXES = [
  { id: "box-1", label: "Section 1" },
  { id: "box-2", label: "Section 2" },
  { id: "box-3", label: "Section 3" },
  { id: "box-4", label: "Section 4" },
] as const;

function PlaceholderBox({ label }: { label: string }) {
  return (
    <div
      className="flex h-56 w-full max-w-3xl flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900/40 sm:h-64"
      aria-label={label}
    >
      <span className="text-sm font-medium uppercase tracking-widest text-slate-400">{label}</span>
      <span className="mt-2 text-xs text-slate-400">Content coming soon</span>
    </div>
  );
}

export function HomePage() {
  const { user, status } = useAuth();

  return (
    <main className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Project VL</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Learn with visual explanations
        </h1>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/app"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Try for free
          </Link>
          {status !== "authenticated" ? (
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              Log in
            </Link>
          ) : (
            <Link
              href="/app"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              Open workspace
            </Link>
          )}
        </div>
        {user ? (
          <p className="mt-3 text-sm text-slate-500">Signed in as {user.email}</p>
        ) : null}
      </section>

      {PLACEHOLDER_BOXES.map((box) => (
        <ScrollRevealSection key={box.id}>
          <PlaceholderBox label={box.label} />
        </ScrollRevealSection>
      ))}

      <footer className="border-t border-slate-200 py-12 text-center text-sm text-slate-500 dark:border-slate-800">
        End of page — more sections can be added here.
      </footer>
    </main>
  );
}
