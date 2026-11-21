"use client";

import React from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LandingHero() {
  const { openModal } = useAuth();

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft/60 px-4 py-1.5 text-xs sm:text-sm font-semibold text-accent">
          <span>🗣️</span>
          <span>Voice-First Accessible Form Assistant</span>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-ink">
            Fill Any Form Just by Talking,
            <span className="block text-accent mt-1">In Your Own Language.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted">
            FormSathi AI guides elderly citizens, students, and low-literacy users through complex government, bank, and scholarship forms using voice conversation in <strong>Kannada</strong>, <strong>Hindi</strong>, or <strong>English</strong>.
          </p>
        </div>

        {/* Call to action card */}
        <div className="mx-auto max-w-md rounded-2xl border border-line bg-card p-6 shadow-xl sm:p-8 space-y-4">
          <div className="space-y-2 text-center">
            <h2 className="font-display text-xl font-bold text-ink">Sign In to Open Dashboard</h2>
            <p className="text-xs text-muted">
              Create a free account or sign in to upload PDF forms, use conversational voice filling, and download filled documents.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => openModal("login")}
              className="flex-1 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-ink shadow-sm transition hover:opacity-90 active:scale-98 focus-visible:outline-2 focus-visible:outline-accent"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openModal("register")}
              className="flex-1 rounded-xl border-2 border-accent/30 bg-paper px-5 py-3 text-sm font-bold text-ink transition hover:bg-line/40 hover:border-accent active:scale-98 focus-visible:outline-2 focus-visible:outline-accent"
            >
              Create Account
            </button>
          </div>

          <p className="text-[11px] text-muted text-center pt-1">
            🔒 <strong>Zero-Retention Guarantee:</strong> Your form answers, Aadhaar, and bank details are never saved in any database.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
          <div className="rounded-2xl border border-line bg-card/60 p-5 space-y-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-accent-soft text-accent text-xl">
              🌐
            </div>
            <h3 className="font-display text-base font-bold text-ink">Multilingual Voice</h3>
            <p className="text-xs text-muted leading-relaxed">
              Supports Kannada (ಕನ್ನಡ), Hindi (हिंदी), English, and Hinglish with high-accuracy Indian speech recognition.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card/60 p-5 space-y-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-ok-soft text-ok text-xl">
              📄
            </div>
            <h3 className="font-display text-base font-bold text-ink">PDF Auto-Field Extraction</h3>
            <p className="text-xs text-muted leading-relaxed">
              Upload any flat or fillable PDF. FormSathi reads the fields and asks short, friendly spoken questions.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card/60 p-5 space-y-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-warn-soft text-warn text-xl">
              🛡️
            </div>
            <h3 className="font-display text-base font-bold text-ink">100% In-Browser Privacy</h3>
            <p className="text-xs text-muted leading-relaxed">
              PDF parsing and document filling run completely in your browser. All answers disappear when the tab closes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
