"use client";

import { useState } from "react";

interface Props {
  onClearSession?: () => void;
}

export default function PrivacyBanner({ onClearSession }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      aria-label="Privacy & Security Notice"
      className="mb-4 rounded-2xl border border-ok/30 bg-ok-soft/30 p-3.5 sm:p-4 text-xs shadow-2xs transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ok text-white text-xs font-bold">
            🛡️
          </span>
          <span className="font-bold text-ink sm:text-sm">
            Zero-Retention Privacy & Shared-Device Protection
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onClearSession && (
            <button
              type="button"
              onClick={onClearSession}
              className="rounded-lg border border-danger/30 bg-card px-2.5 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-danger"
              title="Instantly clear all temporary form answers and PDF from browser memory"
            >
              🧹 Wipe & Clear Session
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted hover:text-ink text-xs underline font-medium"
            aria-expanded={!collapsed}
          >
            {collapsed ? "Learn more" : "Hide details"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-2.5 grid gap-2 sm:grid-cols-3 text-muted border-t border-ok/20 pt-2.5 text-[11px] leading-relaxed">
          <div>
            <strong className="block text-ink font-semibold">1. Zero Database Storage</strong>
            Your personal details, Aadhaar, phone numbers, and answers are never stored in any database.
          </div>
          <div>
            <strong className="block text-ink font-semibold">2. Local Browser Memory</strong>
            Form values and PDFs exist solely in your temporary browser RAM and disappear when you leave.
          </div>
          <div>
            <strong className="block text-ink font-semibold">3. CSC / Cybercafe Safe</strong>
            Using a shared or public computer? Simply close this tab or click &ldquo;Wipe & Clear Session&rdquo; to leave no trace.
          </div>
        </div>
      )}
    </aside>
  );
}
