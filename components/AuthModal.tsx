"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AuthModal() {
  const { isModalOpen, modalMode, openModal, closeModal, login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (modalMode === "login") {
        const res = await login(email, password);
        if (!res.ok) setError(res.error || "Login failed");
      } else {
        if (!name.trim()) {
          setError("Name is required");
          setSubmitting(false);
          return;
        }
        const res = await register(name, email, password);
        if (!res.ok) setError(res.error || "Registration failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
      onKeyDown={(e) => e.key === "Escape" && closeModal()}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-line/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="Close dialog"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex border-b border-line mb-6">
          <button
            type="button"
            onClick={() => {
              openModal("login");
              setError(null);
            }}
            className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors ${
              modalMode === "login"
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-ink"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              openModal("register");
              setError(null);
            }}
            className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors ${
              modalMode === "register"
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-ink"
            }`}
          >
            Create Account
          </button>
        </div>

        <h2 id="auth-modal-title" className="font-display text-2xl font-bold tracking-tight">
          {modalMode === "login" ? "Welcome back" : "Create an account"}
        </h2>
        <p className="mt-1 text-xs text-muted">
          Your credentials are securely stored. Form answers and uploaded PDFs are <strong>never</strong> saved to your account.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {modalMode === "register" && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vaishnavi Mutalikdesai"
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-accent"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Password {modalMode === "register" && "(min 6 characters)"}
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={modalMode === "register" ? 6 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink shadow-sm transition hover:opacity-90 active:scale-98 disabled:opacity-60"
          >
            {submitting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : modalMode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
