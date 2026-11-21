"use client";

import { useEffect, useState } from "react";
import { playEarcon } from "@/lib/earcons";

type FontSize = "normal" | "large" | "xlarge";

export default function AccessibilityControls() {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("normal");

  useEffect(() => {
    // Restore user preferences
    const savedContrast = localStorage.getItem("formsathi_high_contrast") === "true";
    const savedFont = (localStorage.getItem("formsathi_font_size") as FontSize) || "normal";

    if (savedContrast) {
      setHighContrast(true);
      document.documentElement.classList.add("high-contrast");
    }

    if (savedFont === "large") {
      setFontSize("large");
      document.documentElement.classList.add("font-large");
    } else if (savedFont === "xlarge") {
      setFontSize("xlarge");
      document.documentElement.classList.add("font-xlarge");
    }

    // Keyboard shortcut: Alt+H to toggle high contrast
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        toggleContrast();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleContrast() {
    setHighContrast((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("high-contrast");
        localStorage.setItem("formsathi_high_contrast", "true");
        playEarcon("success");
      } else {
        document.documentElement.classList.remove("high-contrast");
        localStorage.setItem("formsathi_high_contrast", "false");
        playEarcon("listen");
      }
      return next;
    });
  }

  function cycleFontSize() {
    const next: FontSize = fontSize === "normal" ? "large" : fontSize === "large" ? "xlarge" : "normal";
    setFontSize(next);
    localStorage.setItem("formsathi_font_size", next);

    document.documentElement.classList.remove("font-large", "font-xlarge");
    if (next === "large") {
      document.documentElement.classList.add("font-large");
    } else if (next === "xlarge") {
      document.documentElement.classList.add("font-xlarge");
    }
    playEarcon("tone");
  }

  return (
    <div className="flex items-center gap-1.5" role="toolbar" aria-label="Accessibility options">
      {/* High Contrast Toggle */}
      <button
        type="button"
        onClick={toggleContrast}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-accent ${
          highContrast
            ? "border-2 border-yellow-400 bg-black text-yellow-400"
            : "border border-line bg-card text-muted hover:text-ink"
        }`}
        aria-pressed={highContrast}
        title="Toggle High Contrast Mode (Alt+H) for low-vision accessibility"
      >
        <span aria-hidden>👁️</span>
        <span className="hidden sm:inline">{highContrast ? "High Contrast: ON" : "High Contrast"}</span>
      </button>

      {/* Font Size Toggle */}
      <button
        type="button"
        onClick={cycleFontSize}
        className="flex items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-bold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        title="Cycle Text Size (Normal, Large, Extra Large)"
        aria-label={`Current text size: ${fontSize}. Tap to enlarge`}
      >
        <span aria-hidden className="font-serif font-black">
          A
        </span>
        <span className="text-[10px] uppercase font-semibold">
          {fontSize === "normal" ? "100%" : fontSize === "large" ? "115%" : "130%"}
        </span>
      </button>
    </div>
  );
}
