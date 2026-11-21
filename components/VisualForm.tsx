"use client";

import React from "react";
import type { Field, Lang } from "@/lib/types";
import { validate } from "@/lib/validate";
import { brief } from "@/lib/client";

interface Props {
  fields: Field[];
  values: Record<string, string>;
  lang: Lang;
  onChangeValue: (fieldId: string, value: string) => void;
  onSubmit: () => void;
  onSwitchMode: (mode: "voice" | "conversational") => void;
}

export default function VisualForm({
  fields,
  values,
  lang,
  onChangeValue,
  onSubmit,
  onSwitchMode,
}: Props) {
  const filledCount = fields.filter((f) => values[f.id]).length;
  const progressPct = Math.round((filledCount / Math.max(1, fields.length)) * 100);

  return (
    <div className="flex-1 rounded-2xl border border-line bg-card p-5 sm:p-8 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Form Mode: Visual Direct Input
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Fill Directly on Screen
          </h2>
          <p className="mt-1 text-sm text-muted">
            Type answers directly or switch to Voice-Assisted or Conversational modes anytime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchMode("voice")}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink hover:border-accent transition"
          >
            <span>🎙️</span>
            <span>Voice-Assisted</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode("conversational")}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <span>💬</span>
            <span>Hands-Free Voice</span>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold text-muted mb-1.5">
          <span>{filledCount} of {fields.length} fields filled</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={filledCount} aria-valuemin={0} aria-valuemax={fields.length}>
          <div className="h-full bg-ok transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((f, i) => {
            const val = values[f.id] || "";
            const err = val ? validate(brief(f), val, lang) : null;
            const isValid = Boolean(val && !err);

            return (
              <div
                key={f.id}
                className={`flex flex-col rounded-xl border p-4 transition-colors ${
                  isValid
                    ? "border-ok/30 bg-ok-soft/10"
                    : err
                      ? "border-danger/40 bg-danger/5"
                      : "border-line bg-paper/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor={`field-${f.id}`} className="text-sm font-semibold text-ink">
                    <span className="text-muted mr-1.5">{i + 1}.</span>
                    {f.label.replace(/^\d+\.\s*/, "")}
                    {f.required ? (
                      <span className="text-danger ml-1" title="Required field">*</span>
                    ) : (
                      <span className="text-xs font-normal text-muted ml-1.5">(optional)</span>
                    )}
                  </label>

                  {isValid && <span className="text-ok font-bold text-sm" title="Valid">✓</span>}
                </div>

                {f.type === "choice" && f.options && f.options.length > 0 ? (
                  <select
                    id={`field-${f.id}`}
                    value={val}
                    onChange={(e) => onChangeValue(f.id, e.target.value)}
                    required={f.required}
                    className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-base text-ink focus:border-accent outline-none"
                  >
                    <option value="">Select option…</option>
                    {f.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`field-${f.id}`}
                    type={
                      f.type === "phone" || f.type === "number" || f.type === "pincode"
                        ? "tel"
                        : f.type === "email"
                          ? "email"
                          : f.type === "date"
                            ? "date"
                            : "text"
                    }
                    value={val}
                    onChange={(e) => onChangeValue(f.id, e.target.value)}
                    placeholder={`Enter ${f.label.replace(/^\d+\.\s*/, "").toLowerCase()}`}
                    required={f.required}
                    className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-base text-ink focus:border-accent outline-none shadow-2xs"
                  />
                )}

                {err && (
                  <span className="mt-1.5 text-xs font-semibold text-danger" role="alert">
                    ⚠️ {err}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line">
          <p className="text-xs text-muted">
            Form responses are kept 100% locally in your browser memory.
          </p>

          <button
            type="submit"
            className="rounded-xl bg-accent px-8 py-3.5 text-base font-bold text-accent-ink shadow-md transition hover:opacity-90 active:scale-98 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Review & Complete Form →
          </button>
        </div>
      </form>
    </div>
  );
}
