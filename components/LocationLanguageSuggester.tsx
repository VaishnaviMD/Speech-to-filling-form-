"use client";

import { useEffect, useState } from "react";
import { REGION_LANGUAGE_MAP, detectRegion, type RegionRecommendation } from "@/lib/location";
import { LANG_LABEL } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

interface Props {
  currentLang: Lang;
  onSelectLang: (lang: Lang) => void;
}

export default function LocationLanguageSuggester({ currentLang, onSelectLang }: Props) {
  const [recommendation, setRecommendation] = useState<RegionRecommendation | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has a previously detected region
    const savedRegion = localStorage.getItem("formsathi_region");
    if (savedRegion && REGION_LANGUAGE_MAP[savedRegion]) {
      setRecommendation({
        state: savedRegion,
        recommendedLanguages: REGION_LANGUAGE_MAP[savedRegion].languages,
        detectedVia: "manual",
      });
    }
  }, []);

  async function handleDetectLocation() {
    setDetecting(true);
    try {
      const rec = await detectRegion();
      setRecommendation(rec);
      localStorage.setItem("formsathi_region", rec.state);
      // If current language is not in recommended, switch to top recommended language
      if (rec.recommendedLanguages.length > 0 && !rec.recommendedLanguages.includes(currentLang)) {
        onSelectLang(rec.recommendedLanguages[0]);
      }
    } finally {
      setDetecting(false);
    }
  }

  function handleManualStateSelect(regionKey: string) {
    if (!REGION_LANGUAGE_MAP[regionKey]) return;
    const rec: RegionRecommendation = {
      state: regionKey,
      recommendedLanguages: REGION_LANGUAGE_MAP[regionKey].languages,
      detectedVia: "manual",
    };
    setRecommendation(rec);
    localStorage.setItem("formsathi_region", regionKey);
    if (rec.recommendedLanguages.length > 0 && !rec.recommendedLanguages.includes(currentLang)) {
      onSelectLang(rec.recommendedLanguages[0]);
    }
  }

  const regionLabel = recommendation ? REGION_LANGUAGE_MAP[recommendation.state]?.label : null;

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-muted hover:text-ink transition shadow-2xs"
          title="Location-aware local language suggestions"
        >
          <span>📍</span>
          <span>{regionLabel ? regionLabel : "Detect Region"}</span>
          <span className="text-[10px]">▼</span>
        </button>

        {recommendation && (
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-accent">
            <span>Recommended:</span>
            {recommendation.recommendedLanguages.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onSelectLang(l)}
                className={`rounded px-1.5 py-0.5 text-xs font-bold transition ${
                  currentLang === l
                    ? "bg-accent text-accent-ink"
                    : "bg-accent-soft/40 text-accent hover:bg-accent-soft"
                }`}
              >
                {LANG_LABEL[l] || l}
              </button>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-line bg-card p-4 shadow-xl text-ink">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Location & Languages
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 text-xs text-muted leading-relaxed">
            FormSathi AI suggests suitable local languages based on your region (e.g. Kannada in Bengaluru, Marathi in Maharashtra). Exact GPS is never stored.
          </p>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-ink shadow-xs transition hover:opacity-90 disabled:opacity-50"
          >
            <span>{detecting ? "Detecting…" : "📍 Detect Region via GPS"}</span>
          </button>

          <div className="mt-3">
            <label htmlFor="state-select" className="block text-[11px] font-semibold text-muted mb-1">
              Or pick your State / Region manually:
            </label>
            <select
              id="state-select"
              value={recommendation?.state || ""}
              onChange={(e) => handleManualStateSelect(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-accent outline-none"
            >
              <option value="">Choose region…</option>
              {Object.entries(REGION_LANGUAGE_MAP).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {recommendation && (
            <div className="mt-3 rounded-xl bg-ok-soft/30 p-2.5 text-xs">
              <span className="font-semibold text-ok block mb-1">
                Recommended for {REGION_LANGUAGE_MAP[recommendation.state]?.label}:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {recommendation.recommendedLanguages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      onSelectLang(l);
                      setIsOpen(false);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      currentLang === l ? "bg-accent text-accent-ink" : "bg-card border border-line text-ink hover:border-accent"
                    }`}
                  >
                    {LANG_LABEL[l]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
