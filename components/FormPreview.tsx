"use client";

import { t } from "@/lib/i18n";
import type { Field, Lang } from "@/lib/types";

type Props = {
  title: string;
  fields: Field[];
  values: Record<string, string>;
  skipped: Record<string, boolean>;
  current: number | null;
  lastFilled: string | null;
  pendingFieldId?: string | null;
  pendingValue?: string | null;
  lang: Lang;
  onPick: (i: number) => void;
};

export default function FormPreview({
  title,
  fields,
  values,
  skipped,
  current,
  lastFilled,
  pendingFieldId,
  pendingValue,
  lang,
  onPick,
}: Props) {
  return (
    <section aria-label={t("form", lang)} className="rounded-2xl border border-line bg-card shadow-sm">
      <div className="border-b border-line px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("form", lang)}</p>
        <h2 className="font-display text-lg leading-snug">{title}</h2>
        <p className="mt-1 text-sm text-muted">{t("edit", lang)}</p>
      </div>
      <ol className="divide-y divide-line">
        {fields.map((f, i) => {
          const v = values[f.id];
          const active = i === current;
          const isPending = f.id === pendingFieldId && !v;
          const state = v ? "filled" : isPending ? "pending" : skipped[f.id] ? "skipped" : "empty";
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onPick(i)}
                aria-current={active ? "step" : undefined}
                className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-accent-soft/50 focus-visible:outline-2 focus-visible:outline-accent ${
                  active ? "bg-accent-soft" : ""
                } ${lastFilled === f.id ? "just-filled" : ""}`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    state === "filled"
                      ? "bg-ok text-white"
                      : state === "pending"
                        ? "bg-warn text-white animate-pulse"
                        : active
                          ? "bg-accent text-accent-ink"
                          : "border border-line text-muted"
                  }`}
                >
                  {state === "filled" ? "✓" : state === "pending" ? "?" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-muted">
                    {f.label.replace(/^\d+\.\s*/, "")}
                    {!f.required && <span className="ml-1 italic">({t("optional", lang)})</span>}
                  </span>
                  <span
                    className={`mt-0.5 block min-h-7 break-words rounded-md border px-2 py-0.5 text-base font-medium ${
                      v
                        ? "border-ok/40 text-ink"
                        : isPending
                          ? "border-warn border-dashed bg-warn-soft/40 text-warn font-semibold"
                          : "border-dashed border-line text-muted/60"
                    }`}
                  >
                    {v || (isPending ? `${pendingValue} (${t("confirmingBadge", lang)})` : state === "skipped" ? "—" : " ")}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
