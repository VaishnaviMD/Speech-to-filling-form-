"use client";

type Props = { listening: boolean; busy: boolean; disabled?: boolean; label: string; onClick: () => void };

export default function MicButton({ listening, busy, disabled, label, onClick }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || busy}
        aria-label={label}
        aria-pressed={listening}
        className={`flex h-28 w-28 items-center justify-center rounded-full text-accent-ink shadow-lg transition-transform focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent active:scale-95 disabled:opacity-60 sm:h-32 sm:w-32 ${
          listening ? "listening bg-danger" : "bg-accent"
        }`}
      >
        {busy ? (
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent" />
        ) : listening ? (
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="currentColor" aria-hidden>
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-14 w-14" fill="currentColor" aria-hidden>
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.07A7 7 0 0 1 5 12a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z" />
          </svg>
        )}
      </button>
      <p className="text-center text-lg font-medium" aria-live="polite">
        {label}
      </p>
    </div>
  );
}
