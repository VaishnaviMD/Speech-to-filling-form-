"use client";

import { use, useEffect, useState } from "react";
import BoloApp from "@/components/BoloApp";
import Navbar from "@/components/Navbar";
import type { OrgFormDefinition } from "@/lib/types";

export default function FillPublicFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [form, setForm] = useState<OrgFormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/org/forms/${id}`);
        if (!res.ok) throw new Error("This form could not be loaded or is unpublished.");
        const data = await res.json();
        setForm(data.form);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper text-ink">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="mt-4 text-base font-medium">Loading official form…</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center text-ink">
        <span className="text-4xl">⚠️</span>
        <h1 className="mt-2 text-2xl font-bold">Form Unavailable</h1>
        <p className="mt-1 text-sm text-muted">{error || "Form not found."}</p>
        <a href="/" className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink">
          Return to FormSathi AI Home
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6">
        <div className="rounded-xl border border-line bg-card/60 px-4 py-2 text-xs text-muted flex items-center justify-between">
          <span className="font-semibold text-ink">🏢 Official Form: {form.title}</span>
          <span>Zero-Retention Privacy Mode Active</span>
        </div>
      </div>
      <BoloApp initialOrgForm={form} />
    </div>
  );
}
