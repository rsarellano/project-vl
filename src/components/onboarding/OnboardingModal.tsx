"use client";

import { useEffect, useState } from "react";
import {
  getLearningPreferences,
  SUBJECT_DOMAINS,
  USAGE_CONTEXTS,
  type SubjectDomainId,
  type UsageContextId,
  type UserLearningPreferences,
} from "@/lib/userPreferences";

type OnboardingModalProps = {
  open: boolean;
  onComplete: (prefs: UserLearningPreferences) => void;
};

function OptionCard({
  selected,
  label,
  description,
  onClick,
}: {
  selected: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
        selected
          ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
      }`}
    >
      <span className="block font-semibold text-slate-900 dark:text-slate-100">{label}</span>
      <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{description}</span>
    </button>
  );
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [usageContext, setUsageContext] = useState<UsageContextId | null>(null);
  const [subjectDomain, setSubjectDomain] = useState<SubjectDomainId | null>(null);

  useEffect(() => {
    if (!open) return;
    const stored = getLearningPreferences();
    if (stored) {
      setUsageContext(stored.usageContext);
      setSubjectDomain(stored.subjectDomain);
      setStep(1);
      return;
    }
    setStep(1);
    setUsageContext(null);
    setSubjectDomain(null);
  }, [open]);

  if (!open) return null;

  const canContinueStep1 = usageContext !== null;
  const canFinish = usageContext !== null && subjectDomain !== null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          Step {step} of 2
        </p>
        <h2 id="onboarding-title" className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          {step === 1 ? "How will you use Project VL?" : "What kinds of questions will you ask?"}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {step === 1
            ? "This helps tailor tone and examples. No account needed — try for free."
            : "We use this to focus the AI on the right subject area."}
        </p>

        <div className="mt-5 max-h-[min(50vh,360px)] space-y-2 overflow-y-auto pr-1">
          {step === 1
            ? USAGE_CONTEXTS.map((opt) => (
                <OptionCard
                  key={opt.id}
                  selected={usageContext === opt.id}
                  label={opt.label}
                  description={opt.description}
                  onClick={() => setUsageContext(opt.id)}
                />
              ))
            : SUBJECT_DOMAINS.map((opt) => (
                <OptionCard
                  key={opt.id}
                  selected={subjectDomain === opt.id}
                  label={opt.label}
                  description={opt.description}
                  onClick={() => setSubjectDomain(opt.id)}
                />
              ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {step === 1 ? (
            <button
              type="button"
              disabled={!canContinueStep1}
              onClick={() => setStep(2)}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={!canFinish}
              onClick={() => {
                if (!usageContext || !subjectDomain) return;
                onComplete({ usageContext, subjectDomain });
              }}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Start exploring
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
