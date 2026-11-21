"use client";

import React from "react";
import AccessibilityControls from "./AccessibilityControls";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Navbar() {
  const { user, loading, openModal, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-ink shadow-sm text-lg font-bold">
              🗣️
            </span>
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-tight text-ink">
                FormSathi <span className="text-accent">AI</span>
              </span>
              <span className="hidden text-[10px] uppercase tracking-wider text-muted sm:inline-block">
                Zero-Retention Voice Assistant
              </span>
            </div>
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <AccessibilityControls />

          <span className="hidden items-center gap-1.5 rounded-full border border-ok/30 bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />
            100% In-Browser Privacy
          </span>

          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-line/60" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-1.5 shadow-2xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-ink text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-medium text-ink max-w-[120px] truncate sm:max-w-none">
                  {user.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-line/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openModal("login")}
              className="rounded-xl bg-accent px-3.5 py-1.5 text-xs font-bold text-accent-ink shadow-xs transition hover:opacity-90 active:scale-98 focus-visible:outline-2 focus-visible:outline-accent"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
