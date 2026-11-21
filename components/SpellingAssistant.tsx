"use client";

import React, { useState } from "react";
import { t } from "@/lib/i18n";
import { characterReadout, digitReadout, formatNumberChunks } from "@/lib/spelling";
import type { Field, Lang } from "@/lib/types";

type Props = {
  field: Field;
  initialValue: string;
  lang: Lang;
  onApply: (value: string) => void;
  onClose: () => void;
  speakText: (text: string) => void;
};

export default function SpellingAssistant({
  field,
  initialValue,
  lang,
  onApply,
  onClose,
  speakText,
}: Props) {
  const [val, setVal] = useState(initialValue);
  const isNumeric = ["phone", "aadhaar", "pincode", "account", "number", "ifsc"].includes(field.type);
  const isEmail = field.type === "email";

  const handleBackspace = () => {
    setVal((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setVal("");
  };

  const handleReadLetters = () => {
    if (!val.trim()) return;
    if (isNumeric) {
      speakText(digitReadout(val));
    } else {
      speakText(characterReadout(val));
    }
  };

  const handleApply = () => {
    if (!val.trim()) return;
    onApply(val.trim());
  };

  const chunkedDisplay = isNumeric ? formatNumberChunks(val, field.type) : val;

  return (
    <div
      role="dialog"
      aria-labelledby="spelling-title"
      className="my-5 rounded-2xl border-2 border-accent bg-card p-5 shadow-lg animate-in fade-in"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
            🔤 {t("spellTitle", lang)}
          </span>
          <h3 id="spelling-title" className="mt-1 font-display text-lg font-bold text-ink">
            {field.label.replace(/^\d+\.\s*/, "")}
          </h3>
          <p className="text-xs text-muted">
            {isEmail
              ? "Tip: Say 'vaishnavi at gmail dot com' or spell letters individually."
              : isNumeric
                ? "Tip: Dictate digits individually or in groups of 2-4 digits."
                : t("spellSubtitle", lang)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted hover:bg-line/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          aria-label={t("closeSpelling", lang)}
        >
          ✕
        </button>
      </div>

      {/* Character Tiles Display */}
      <div className="my-4">
        <label htmlFor="spelling-input" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Current Characters ({val.length} {isNumeric ? "digits" : "letters"}):
        </label>

        {val.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-line bg-paper">
            {val.split("").map((ch, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center h-12 w-9 rounded-lg border border-accent/40 bg-card text-ink shadow-2xs"
              >
                <span className="font-mono text-base font-bold">{ch === " " ? "␣" : ch}</span>
                <span className="text-[9px] text-muted">{idx + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
            No characters entered yet. Tap the mic or type below.
          </div>
        )}

        {isNumeric && val.length > 0 && (
          <p className="mt-2 text-sm font-semibold text-accent">
            Standard Format: <span className="font-mono tracking-wider">{chunkedDisplay}</span>
          </p>
        )}
      </div>

      {/* Manual input sync */}
      <div className="mb-4">
        <input
          id="spelling-input"
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Type or dictate characters..."
          className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-lg font-mono font-bold text-ink focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
        <button
          type="button"
          onClick={handleReadLetters}
          disabled={!val.trim()}
          className="rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-bold text-ink hover:bg-line/40 disabled:opacity-40"
        >
          {isNumeric ? t("readDigits", lang) : t("readLetters", lang)}
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          disabled={!val.length}
          className="rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-bold text-muted hover:text-danger hover:border-danger/40 disabled:opacity-40"
        >
          {t("deleteChar", lang)}
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={!val.length}
          className="rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-bold text-muted hover:text-danger hover:border-danger/40 disabled:opacity-40"
        >
          {t("clearAll", lang)}
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={handleApply}
          disabled={!val.trim()}
          className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-accent-ink shadow-xs hover:opacity-90 active:scale-98 disabled:opacity-40"
        >
          {t("applySpelling", lang)}
        </button>
      </div>
    </div>
  );
}
