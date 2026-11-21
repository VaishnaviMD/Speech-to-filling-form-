# FormSathi AI 🗣️📄

**Fill any form just by talking, in your own language.**

FormSathi AI is an accessible, multilingual, voice-first form-filling assistant that fills government, bank, medical, and scholarship forms through natural speech and visual interaction. Upload a PDF, answer spoken questions or type directly, and download the verified filled form with zero data retention.

---

## Key Features

1. **Three Ways to Complete a Form:**
   - **Visual Form:** Full visual form sheet with direct keyboard entry, field types, and real-time inline validation checkmarks.
   - **Voice-Assisted:** Focused interactive step-by-step card with manual tap-to-talk mic and spelling mode.
   - **Fully Conversational:** 100% hands-free voice interview with Web Audio API Voice Activity & Silence Detection (VAD), earcon chimes, and repeated spelling readout.
   - **Seamless Mode Switching:** Switch between all 3 modes anytime with zero progress loss.

2. **Total Hands-Free Independence for Blind Users:**
   - Turn-taking conversational voice loop with automated silence detection.
   - Ascending chime when mic opens, soft tone when audio is captured, major chord when confirmed.
   - Full screen-reader support with `aria-live="assertive"` announcements of every question, validation error, and navigation action.
   - High Contrast Mode (WCAG AAA yellow-on-black) and font scaling (`100%`, `115%`, `130%`).
   - Spacebar shortcut to pause/resume listening; `Alt+H` for high contrast.

3. **Smart Spelling & Number Mode:**
   - Automatic letter-by-letter spelling readout (*"I heard Vaishnavi, spelled as V, A, I, S, H, N, A, V, I"*).
   - Conversational wrapper stripping (saying *"My name is Vaishnavi"* fills `Vaishnavi`).
   - Digit chunking for 10-digit mobile, 12-digit Aadhaar, and 6-digit PIN code.

4. **Location-Aware Regional Language Suggestions (GPS):**
   - Recommends local languages based on region (e.g. Kannada in Karnataka, Marathi in Maharashtra, Tamil in Tamil Nadu, Hindi in Delhi/UP).
   - Strict privacy: approximate state resolution without storing exact coordinates.

5. **Organisation Form Builder & QR Code Distribution:**
   - Custom form creation for government departments, hospitals, colleges, and NGOs.
   - Add verified local language translations.
   - Public shareable URL (`/fill/[id]`) and high-resolution printable QR code generator for reception desks and counters.

6. **End-of-Form AI Consistency & Validation Evaluation:**
   - Automated cross-field evaluation checking 10-digit Indian mobile numbers, 12-digit Aadhaar, 6-digit PIN codes, IFSC codes, and semantic consistency before finalization.
   - Generates an AI Verification Badge and speaks the auditory audit report aloud.

7. **Zero-Retention Privacy by Design:**
   - Uploaded PDFs and form answers remain in browser memory only.
   - Never saved to any database.
   - Wiped completely upon closing the tab or clicking "Wipe & Clear Session".

---

## Tech Stack & Architecture

- **Framework:** Next.js 16 (Turbopack, App Router) & React 19
- **Database:** Node 24 native SQLite (`node:sqlite`) for user auth & organization form templates only
- **Audio & Speech:** Web Audio API (`AnalyserNode` RMS silence detector, synthesized earcons), browser `speechSynthesis`
- **Speech-to-Text:** Groq Whisper (`whisper-large-v3`) with multilingual hints
- **LLM Engine:** Open-weight models on Groq (`openai/gpt-oss-120b` / `llama-3.3-70b-versatile`)
- **PDF Engine:** In-browser parsing and filling via `pdfjs-dist` and `pdf-lib`

---

## Getting Started

### Prerequisites

- Node.js 20+ (Node 24 recommended)
- A Groq API key from [console.groq.com](https://console.groq.com)

### Installation

```bash
git clone <YOUR_GIT_REPO_URL>
cd formsathi-ai
npm install
```

### Environment Setup

Create `.env.local`:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Microsoft Edge for optimal SpeechSynthesis and Web Audio API capabilities.
