"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { ExtractedField, FieldType, Lang, OrgFormDefinition } from "@/lib/types";
import { FIELD_TYPES, LANGS } from "@/lib/types";
import { LANG_LABEL } from "@/lib/i18n";

interface Props {
  onOpenFormToFill: (form: OrgFormDefinition) => void;
  onBack: () => void;
}

export default function OrgFormBuilder({ onOpenFormToFill, onBack }: Props) {
  const [forms, setForms] = useState<OrgFormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "qr">("list");
  const [activeForm, setActiveForm] = useState<OrgFormDefinition | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form creation state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<ExtractedField[]>([
    {
      id: "f1",
      ref: "f1",
      label: "Full Name",
      type: "name",
      format: null,
      required: true,
      options: null,
    },
    {
      id: "f2",
      ref: "f2",
      label: "Mobile Number",
      type: "phone",
      format: "10-digit mobile",
      required: true,
      options: null,
    },
  ]);
  const [translations, setTranslations] = useState<Partial<Record<Lang, Record<string, string>>>>({
    kn: { f1: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?", f2: "ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ತಿಳಿಸಿ." },
    hi: { f1: "आपका पूरा नाम क्या है?", f2: "अपना 10 अंकों का मोबाइल नंबर बताइए।" },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  async function fetchForms() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org/forms");
      if (!res.ok) throw new Error("Could not load organization forms.");
      const data = await res.json();
      setForms(data.forms || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function addField() {
    const id = "f" + (fields.length + 1);
    setFields([
      ...fields,
      {
        id,
        ref: id,
        label: "New Question",
        type: "text",
        format: null,
        required: true,
        options: null,
      },
    ]);
  }

  function removeField(index: number) {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index));
  }

  function updateField(index: number, patch: Partial<ExtractedField>) {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || fields.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/org/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          fields,
          translations,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save form.");
      }
      const data = await res.json();
      setForms([data.form, ...forms]);
      setView("list");
      setTitle("");
      setDescription("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function openQrModal(form: OrgFormDefinition) {
    setActiveForm(form);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/fill/${form.id}`;
    try {
      const url = await QRCode.toDataURL(publicUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#1f1b16", light: "#ffffff" },
      });
      setQrDataUrl(url);
      setView("qr");
    } catch (e) {
      setError("Failed to generate QR code.");
    }
  }

  function copyPublicLink(formId: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/fill/${formId}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <div className="flex-1 rounded-2xl border border-line bg-card p-5 sm:p-8 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Organisation Portal
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Custom Form Builder & QR Distribution
          </h2>
          <p className="mt-1 text-sm text-muted">
            Create accessible forms, add local-language translations, and generate printable QR codes for public desks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {view !== "list" ? (
            <button
              type="button"
              onClick={() => setView("list")}
              className="rounded-xl border border-line bg-paper px-4 py-2 text-xs font-semibold text-ink hover:border-accent"
            >
              ← Back to My Forms
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-line bg-paper px-4 py-2 text-xs font-semibold text-muted hover:text-ink"
            >
              ← Back to Dashboard
            </button>
          )}

          {view === "list" && (
            <button
              type="button"
              onClick={() => setView("create")}
              className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-ink shadow-xs hover:opacity-90"
            >
              + Create New Form
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          ⚠️ {error}
        </div>
      )}

      {/* VIEW: LIST FORMS */}
      {view === "list" && (
        <div>
          {loading ? (
            <div className="py-12 text-center text-muted">Loading your organization forms…</div>
          ) : forms.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-4xl">📋</span>
              <h3 className="mt-2 text-lg font-bold text-ink">No forms created yet</h3>
              <p className="mt-1 text-sm text-muted">
                Create a form for your department, hospital, or college and share it via link or QR code.
              </p>
              <button
                type="button"
                onClick={() => setView("create")}
                className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink shadow-xs hover:opacity-90"
              >
                + Create Your First Form
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {forms.map((f) => (
                <div key={f.id} className="flex flex-col justify-between rounded-xl border border-line bg-paper/40 p-5 shadow-2xs hover:border-accent transition">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-bold text-ok">
                        Published
                      </span>
                      <span className="text-xs text-muted">
                        {f.fields.length} question(s)
                      </span>
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-ink">{f.title}</h3>
                    {f.description && <p className="mt-1 text-xs text-muted line-clamp-2">{f.description}</p>}
                  </div>

                  <div className="mt-5 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenFormToFill(f)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink hover:opacity-90"
                    >
                      🗣️ Fill / Test Form
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openQrModal(f)}
                        className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-accent"
                        title="Generate Printable QR Code"
                      >
                        📱 QR Code
                      </button>

                      <button
                        type="button"
                        onClick={() => copyPublicLink(f.id)}
                        className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-ink hover:border-accent"
                      >
                        {copiedId === f.id ? "✓ Copied!" : "🔗 Copy Link"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: CREATE FORM */}
      {view === "create" && (
        <form onSubmit={handleSaveForm} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="form-title" className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Form Title *
              </label>
              <input
                id="form-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rural Health Subsidy Application"
                required
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-base text-ink focus:border-accent outline-none"
              />
            </div>
            <div>
              <label htmlFor="form-desc" className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Description / Department
              </label>
              <input
                id="form-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Department of Social Welfare, Bengaluru"
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-base text-ink focus:border-accent outline-none"
              />
            </div>
          </div>

          {/* QUESTIONS LIST */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Form Questions ({fields.length})
              </h3>
              <button
                type="button"
                onClick={addField}
                className="rounded-lg border border-line bg-paper px-3 py-1 text-xs font-bold text-accent hover:border-accent"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="rounded-xl border border-line bg-paper/40 p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-muted">Question {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeField(idx)}
                      disabled={fields.length <= 1}
                      className="text-xs text-danger hover:underline disabled:opacity-30"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(idx, { label: e.target.value })}
                        placeholder="Question label (e.g. Full Name)"
                        required
                        className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(idx, { type: e.target.value as FieldType })}
                        className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink focus:border-accent outline-none"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-4 text-xs text-muted">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(idx, { required: e.target.checked })}
                        className="rounded border-line"
                      />
                      <span>Mandatory field</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-line">
            <button
              type="button"
              onClick={() => setView("list")}
              className="text-xs text-muted hover:text-ink"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-ink shadow-md hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Publishing…" : "✓ Publish Form & Generate QR"}
            </button>
          </div>
        </form>
      )}

      {/* VIEW: QR CODE MODAL */}
      {view === "qr" && activeForm && (
        <div className="py-6 text-center max-w-sm mx-auto">
          <h3 className="text-xl font-bold text-ink">{activeForm.title}</h3>
          <p className="mt-1 text-xs text-muted">
            Display this QR code at reception desks, clinics, or registration counters for instant mobile voice access.
          </p>

          {qrDataUrl && (
            <div className="mt-4 p-4 rounded-2xl border-2 border-line bg-white inline-block shadow-sm">
              <img src={qrDataUrl} alt={`QR Code for ${activeForm.title}`} className="h-64 w-64 mx-auto" />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <a
              href={qrDataUrl}
              download={`${activeForm.title.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
              className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-ink shadow-xs hover:opacity-90 inline-block"
            >
              ⬇️ Download QR Code (PNG)
            </a>

            <button
              type="button"
              onClick={() => copyPublicLink(activeForm.id)}
              className="rounded-xl border border-line bg-paper px-4 py-2 text-xs font-semibold text-ink hover:border-accent"
            >
              {copiedId === activeForm.id ? "✓ Link Copied!" : "🔗 Copy Public URL"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
