# FormSathi AI — Master Implementation & Tracking Plan

**Project:** FormSathi AI (Enhanced from BoloForm)  
**Core Mission:** A secure, multilingual, voice-first form-filling assistant making digital and printed forms universally accessible for elderly, visually impaired, and vernacular language speakers.

---

## Non-Negotiable Architectural Principles
1. **Zero-Retention for Form Answers:** Form answers remain in temporary browser memory. Completed forms, Aadhaar, bank details, and audio recordings are **never** stored in the database.
2. **Strict Privacy Isolation:** Authentication database stores **only** user credentials (email, name, password hash, session token). It is strictly separated from the form-filling session.
3. **Local PDF Processing:** Document parsing (`pdfjs-dist`) and filled PDF generation (`pdf-lib`) execute entirely inside the browser.
4. **No Regressions:** Existing BoloForm features (PDF upload, question extraction, sample forms, voice answering, local PDF download) remain working at every phase.
5. **Deterministic Validation:** Exact fields (emails, phone numbers, Aadhaar, IFSC, dates) use strict deterministic rules, never unverified LLM hallucinations.

---

## Phase Tracking & Status

- [x] **Phase 1: Architecture Inspection & Documentation** (Completed)
- [x] **Phase 2: Secure Authentication & User Session Management** (Completed)
- [x] **Phase 3: Language Selection & Multilingual Engine (English, Hindi, Kannada)** (Completed)
- [x] **Phase 4: Spoken Answer Confirmation Dialogue** (Completed)
- [x] **Phase 5: Smart Spelling and Number Mode** (Completed)
- [x] **Phase 6: Hands-Free Voice Navigation & State Machine** (Completed)
- [ ] **Phase 7: Privacy by Design & Security Hardening**
- [ ] **Phase 7: Privacy by Design & Security Hardening**
- [ ] **Phase 8: Accessibility, High-Contrast & Audio Earcons**
- [ ] **Phase 9: Final Review, Local PDF Generation & End-to-End Testing**

---

## Detailed Phase Breakdown & Verification Guides

### Phase 1: Architecture Inspection & Baseline Verification
- **Status:** COMPLETED
- **Files Inspected:** `package.json`, `app/`, `components/`, `lib/`, `globals.css`
- **Output:** Verified working dev server at `http://localhost:3000` with Groq API integration.

---

### Phase 2: Secure Authentication & User Session Management
- **Status:** COMPLETED
- **Goal:** Introduce professional email/password authentication, sessions, and user navigation bar while strictly keeping form answers ephemeral.
- **Files Involved:**
  - `lib/auth/db.ts` -> Native `node:sqlite` database connection (stored locally in `.data/formsathi.db`, gitignored).
  - `lib/auth/service.ts` -> Scrypt-based password hashing, secure random session tokens, session verification.
  - `app/api/auth/register/route.ts` -> User registration endpoint.
  - `app/api/auth/login/route.ts` -> Login with `Set-Cookie` (HttpOnly, SameSite=Strict).
  - `app/api/auth/logout/route.ts` -> Logout and cookie invalidation.
  - `app/api/auth/me/route.ts` -> Current user verification.
  - `components/Navbar.tsx` -> Navigation bar showing FormSathi AI logo, user status, Login/Register modal button.
  - `components/AuthModal.tsx` -> Accessible modal for Registration and Login with validation.
  - `app/layout.tsx` -> Navbar integration.
- **Frontend Verification:**
  1. Open `http://localhost:3000`.
  2. Click **"Sign In / Register"** in the top-right navbar.
  3. Register with a new email and password.
  4. Notice the navbar immediately updates to display your user name and a **"Sign Out"** button.
  5. Refresh the page: the session persists securely via HttpOnly cookie.
  6. Click **"Sign Out"**: the user session ends cleanly.
  7. Form filling continues to work with zero persistence of answers.

---

### Phase 3: Language Selection & Multilingual Engine (English, Hindi, Kannada)
- **Status:** COMPLETED
- **Goal:** Add full support for Kannada (`kn`) alongside Hindi (`hi`) and English (`en`), with language-selection modal, TTS synthesis, Whisper STT, and prompt engineering.
- **Files Involved:**
  - `lib/types.ts` -> Expand `LANGS = ["en", "hi", "hinglish", "kn"]`.
  - `lib/i18n.ts` -> Add Kannada UI translation dictionary.
  - `lib/speech.ts` -> Add `kn-IN` BCP-47 voice picker with fallback.
  - `lib/llm.ts` -> Add Kannada instructions for question rewriting and answer normalization.
  - `lib/validate.ts` -> Localized error feedback in Kannada.
  - `app/api/transcribe/route.ts` -> Whisper prompt hints for Kannada.
- **Frontend Verification:**
  1. Language picker offers English, Hindi, and Kannada on the home screen.
  2. Switch to Kannada: all UI elements and sample forms display Kannada.
  3. Spoken questions are read using a Kannada voice.
  4. Answering in Kannada is transcribed correctly by Whisper and formatted into the form preview.

---

### Phase 4: Spoken Answer Confirmation Dialogue
- **Status:** COMPLETED
- **Goal:** Ensure the assistant confirms what it heard before filling the form field: *"I heard [Value]. Is that correct?"*
- **Files Involved:**
  - `components/BoloApp.tsx` -> State transition to `confirming`.
  - `components/ConfirmationDialog.tsx` -> Visual & audio confirmation card.
- **Frontend Verification:**
  1. Speak an answer to any question.
  2. Assistant repeats the answer aloud and asks: *"I heard [Value]. Is that correct?"*
  3. Say "Yes" or click Confirm: the field is filled.
  4. Say "No" or click Correct: the mic reopens to accept a corrected answer.

---

### Phase 5: Smart Spelling and Number Mode
- **Status:** COMPLETED
- **Goal:** Allow users to spell names, email addresses, and dictate numbers digit-by-digit without LLM distortions.
- **Files Involved:**
  - `lib/spelling.ts` -> Deterministic letter-by-letter and phonetic parser (NATO/Indian phonetic mappings).
  - `components/SpellingAssistant.tsx` -> Character-by-character display with backspace and correction controls.
- **Frontend Verification:**
  1. On a name or email field, activate spelling mode.
  2. Dictate "V-A-I-S-H-N-A-V-I" or "vaishnavi at gmail dot com".
  3. View the deterministic parsed output without AI hallucination.

---

### Phase 6: Hands-Free Voice Navigation & Blind-Accessible Voice Loop
- **Status:** COMPLETED
- **Goal:** Allow completing the entire form without mouse or keyboard using voice commands, VAD silence auto-stop, and synthesized earcon audio cues.
- **Files Involved:**
  - `lib/voiceNavigation.ts` -> Command parser matching "Next", "Back", "Repeat", "Skip", "Review", "Submit", "Pause", "Resume".
  - `lib/speech.ts` -> Web Audio API volume & silence detection (`autoStopOnSilence`, RMS analysis).
  - `lib/earcons.ts` -> Web Audio API synthesized sound cues (`listen`, `processing`, `success`, `alert`).
  - `components/BoloApp.tsx` -> Turn-taking hands-free continuous loop.
- **Frontend Verification:**
  1. Open any sample form. The assistant asks Question 1.
  2. As soon as the speech ends, a pleasant rising earcon plays and the mic opens automatically.
  3. Speak answer (e.g., "Vaishnavi" or "My name is Vaishnavi").
  4. Stop speaking for 1.3 seconds: mic automatically stops, sounds a processing tone, and normalizes.
  5. Assistant reads spelling confirmation: *"I heard Vaishnavi, spelled as V, A, I, S, H, N, A, V, I. Is this correct? Say yes or no."*
  6. Mic opens automatically. Say "Yes".
  7. Success earcon plays, answer is saved, and Question 2 is asked automatically without touching the screen.
  8. Voice commands "Pause", "Resume", "Next", "Back", "Repeat", "Skip", "Spell" work completely hands-free.

---

### Phase 7: Privacy by Design & Security Hardening
- **Status:** COMPLETED
- **Goal:** Enforce request rate limiting, payload size limits, zero-retention session cleanup, and explicit privacy disclosure banners.
- **Files Involved:**
  - `lib/auth/rateLimit.ts` -> Sliding-window in-memory IP rate limiter for API routes.
  - `app/api/transcribe/route.ts`, `app/api/normalize/route.ts`, `app/api/extract/route.ts`, `app/api/explain/route.ts`, `app/api/questions/route.ts` -> Rate limiting enforced on all endpoints.
  - `components/PrivacyBanner.tsx` -> Explicit transparency banner detailing client-side processing, CSC cybercafe safety, and instant "Wipe & Clear Session" button.
- **Frontend Verification:**
  1. Inspect network tab: no form answers, uploaded PDFs, or personal data sent to any persistence endpoint.
  2. Rapidly spamming API requests triggers `429 Too Many Requests`.
  3. Clicking "Wipe & Clear Session" or signing out completely flushes the temporary form state and browser memory.

---

### Phase 8: Accessibility, High-Contrast & Screen-Reader Optimization
- **Status:** COMPLETED
- **Goal:** Screen-reader optimization (WCAG 2.1 AAA), keyboard focus management, audio chimes (earcons), and high-contrast yellow-on-black theme.
- **Files Involved:**
  - `lib/earcons.ts` -> Synthesized Web Audio API tones (start listening, stop listening, success, alert).
  - `app/globals.css` -> High contrast variables (`--paper: #000000`, `--ink: #ffff00`, `--card: #0d0d0d`), font scaling classes (`.font-large`, `.font-xlarge`).
  - `components/AccessibilityControls.tsx` -> High contrast mode toggle (Alt+H) and Font Size switcher (100%, 115%, 130%) in navbar.
- **Frontend Verification:**
  1. Click "High Contrast" button (or press Alt+H): visual theme immediately switches to WCAG AAA high-contrast yellow on black.
  2. Click font size button to cycle 100% -> 115% -> 130%.
  3. Interact with the mic: distinct auditory earcons play at recording start and completion.
  4. Press Space bar anywhere on the page to pause/resume hands-free mode or stop listening.

---

### Phase 9: Final Review, Local PDF Generation & End-to-End Testing
- **Status:** COMPLETED
- **Goal:** Comprehensive review summary of all fields, read-aloud review, final document download, and zero regression.
- **Files Involved:**
  - `components/BoloApp.tsx` -> Structured final review table, "Read All Answers Aloud" audio readout, and client-side `fillPdf(...)` generation.
  - Complete TypeScript compile clean pass (`npx tsc --noEmit`).
- **Frontend Verification:**
  1. Complete a sample pension form or uploaded PDF from start to finish.
  2. On completion screen, view structured summary of all filled fields with individual "Edit" buttons.
  3. Click "🔊 Read All Answers Aloud" (or say "Read all"): assistant reads all completed answers in sequence.
  4. Click "Download PDF": verified filled PDF is rendered and downloaded 100% locally in the browser with zero server data retention.

---

### Phase 10: Three Ways to Complete a Form (Visual, Voice-Assisted, Fully Conversational)
- **Status:** COMPLETED
- **Goal:** Seamlessly switch between Visual form input, Voice-Assisted, and Fully Conversational hands-free modes.
- **Files Involved:**
  - `components/VisualForm.tsx` -> Full visual form sheet with direct keyboard entry, field types, and inline validation.
  - `components/BoloApp.tsx` -> Interactive mode switcher toolbar (`[📋 Visual Form | 🎙️ Voice-Assisted | 💬 Fully Conversational]`).
  - Screen reader assertive announcer (`aria-live="assertive"`) announcing active question, validation errors, confirmations, and mode changes.
- **Frontend Verification:**
  1. Open any form in `http://localhost:3000`.
  2. Click **"📋 Visual Form"**: view the clean visual sheet, type answers directly into fields.
  3. Click **"🎙️ Voice-Assisted"**: view the focused field card with manual tap-to-talk mic and spelling mode.
  4. Click **"💬 Fully Conversational"**: hands-free turn-taking loop starts automatically with VAD silence detection and earcons.

---

### Phase 11: Organisation Form Builder & QR Code Distribution
- **Status:** COMPLETED
- **Goal:** Allow organisations (Government departments, hospitals, colleges, NGOs) to build custom forms, add verified translations, publish links, and generate printable QR codes.
- **Files Involved:**
  - `lib/auth/db.ts` -> SQLite `org_forms` table.
  - `lib/org/service.ts` -> Form creation, retrieval, updates, and deletion.
  - `app/api/org/forms/route.ts` & `app/api/org/forms/[id]/route.ts` -> API endpoints.
  - `components/OrgFormBuilder.tsx` -> Interactive form builder with question editor, translations, and live high-res QR code generator (`qrcode`).
  - `app/fill/[id]/page.tsx` -> Public access route for citizens to scan/open and fill any official form.
- **Frontend Verification:**
  1. On home screen, click **"🏢 Org Form Builder & QR"**.
  2. Click **"+ Create New Form"**, add custom questions, and click **"✓ Publish Form & Generate QR"**.
  3. Click **"📱 QR Code"**: view the generated QR code and click **"Download QR Code (PNG)"**.
  4. Click **"Copy Link"** or **"Fill / Test Form"**: opens `/fill/[id]` where citizens can complete the form via voice or visual input.

---

### Phase 12: Regional Language Recommendations (GPS-Aware) & AI Form Evaluation
- **Status:** COMPLETED
- **Goal:** Recommend regional languages (Kannada in Karnataka, Marathi in Maharashtra, etc.) based on location with zero coordinate retention, and run an end-of-form AI consistency evaluation.
- **Files Involved:**
  - `lib/location.ts` -> Approximate state bounding box detector and privacy-first geolocation resolver.
  - `components/LocationLanguageSuggester.tsx` -> Header location widget with "Detect Region via GPS" and manual State picker.
  - `app/api/evaluate/route.ts` -> AI consistency and validation endpoint checking Indian mobile (10 digits), Aadhaar (12 digits), PIN code (6 digits), IFSC format, and cross-field coherence.
  - `components/BoloApp.tsx` -> AI Verification Badge & spoken auditory report on form completion screen.
- **Frontend Verification:**
  1. In the header, click **"📍 Detect Region"**.
  2. Click **"Detect Region via GPS"** or select **"Karnataka"** / **"Maharashtra"**.
  3. Notice recommended languages highlighted (e.g. Kannada, English, Hindi in Karnataka; Marathi in Maharashtra).
  4. Complete the form and reach the completion screen: view the **AI Form Evaluation Card** displaying verified score (e.g., 100%), summary, and verified checks.
  5. The assistant announces the evaluation result aloud for blind users.
