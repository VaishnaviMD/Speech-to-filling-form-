"use client";

import { useEffect, useRef, useState } from "react";
import FormPreview from "./FormPreview";
import LocationLanguageSuggester from "./LocationLanguageSuggester";
import MicButton from "./MicButton";
import OrgFormBuilder from "./OrgFormBuilder";
import PrivacyBanner from "./PrivacyBanner";
import SpellingAssistant from "./SpellingAssistant";
import VisualForm from "./VisualForm";
import { useAuth } from "@/lib/auth/AuthContext";
import { isAffirmative, isNegative } from "@/lib/confirmation";
import { playEarcon } from "@/lib/earcons";
import {
  characterReadout,
  digitReadout,
  formatNumberChunks,
  parseSpokenCharacters,
  parseSpokenDigits,
  parseSpokenEmail,
  parseSpellingVoiceCommand,
} from "@/lib/spelling";
import { parseVoiceNavigationCommand } from "@/lib/voiceNavigation";
import { api, brief } from "@/lib/client";
import { LANG_LABEL, t } from "@/lib/i18n";
import { fillPdf, parsePdf, placeFields } from "@/lib/pdf";
import { SAMPLES, sampleFields, type Sample } from "@/lib/samples";
import { extFor, speak, startRecording, stopSpeaking, warmVoices, type Recorder, type RecordingOptions } from "@/lib/speech";
import { LANGS, type Field, type FieldBrief, type FormEvaluationResult, type FormMode, type Lang, type OrgFormDefinition } from "@/lib/types";
import { localNormalize, validate } from "@/lib/validate";

type Stage = "home" | "loading" | "talk" | "done";
type Phase = "idle" | "speaking" | "listening" | "thinking";
type QMap = Partial<Record<Lang, Record<string, string>>>;

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function nextOpen(from: number, fields: Field[], values: Record<string, string>, skipped: Record<string, boolean>) {
  const open = (f: Field) => !values[f.id] && !skipped[f.id];
  for (let i = from + 1; i < fields.length; i++) if (open(fields[i])) return i;
  for (let i = 0; i < fields.length; i++) if (open(fields[i]) && fields[i].required) return i;
  return -1;
}

export default function BoloApp({ initialOrgForm }: { initialOrgForm?: OrgFormDefinition } = {}) {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>("hi");
  const [stage, setStage] = useState<Stage>("home");
  const [formMode, setFormMode] = useState<FormMode>("conversational");
  const [isOrgPortalOpen, setIsOrgPortalOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<FormEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [questions, setQuestions] = useState<QMap>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [assistant, setAssistant] = useState("");
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastFilled, setLastFilled] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    fieldId: string;
    value: string;
    originalAnswer: string;
  } | null>(null);
  const [isSpellingActive, setIsSpellingActive] = useState(false);
  const [handsFree, setHandsFree] = useState(true);
  const [isHandsFreePaused, setIsHandsFreePaused] = useState(false);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const pdfBytes = useRef<Uint8Array | null>(null);
  const recorder = useRef<Recorder | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handsFreeRef = useRef(handsFree);
  const isPausedRef = useRef(isHandsFreePaused);
  const stageRef = useRef(stage);
  const phaseRef = useRef(phase);
  const isAutoStoppingRef = useRef(false);
  const processingLockRef = useRef(false);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  useEffect(() => {
    isPausedRef.current = isHandsFreePaused;
  }, [isHandsFreePaused]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    warmVoices();
    return () => {
      stopSpeaking();
      recorder.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (initialOrgForm) {
      const fs: Field[] = initialOrgForm.fields.map((f, i) => ({
        ...f,
        placement: { kind: "overlay", page: 1, x: 50, y: 700 - i * 35, size: 10 },
      }));
      const qs: QMap = (initialOrgForm.translations as QMap) || {};
      begin(fs, qs, initialOrgForm.title);
    }
  }, [initialOrgForm]);

  // Keyboard accessibility for blind & keyboard users (Spacebar to pause/resume or stop listening)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (phaseRef.current === "speaking") {
          stopSpeaking();
          setPhase("idle");
        } else if (phaseRef.current === "listening") {
          handleAutoStop();
        } else if (stageRef.current === "talk") {
          if (isPausedRef.current) {
            setIsHandsFreePaused(false);
            isPausedRef.current = false;
            triggerAutoListen();
          } else {
            setIsHandsFreePaused(true);
            isPausedRef.current = true;
            playEarcon("alert");
          }
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function say(text: string, l: Lang = lang) {
    setAssistant(text);
    setAnnouncement(text);
    setPhase("speaking");
    await speak(text, l);
    setPhase((p) => (p === "speaking" ? "idle" : p));

    // Automatically trigger hands-free listening if in conversational mode and active
    if (formMode === "conversational" && handsFreeRef.current && !isPausedRef.current && stageRef.current === "talk") {
      setTimeout(() => {
        triggerAutoListen();
      }, 250);
    }
  }

  function questionFor(i: number, fs: Field[], qs: QMap, l: Lang) {
    const f = fs[i];
    return qs[l]?.[f.id] ?? f.label.replace(/^\d+\.\s*/, "") + "?";
  }

  function ask(i: number, fs = fields, qs = questions, l = lang) {
    setIdx(i);
    setHeard("");
    setExplanation(null);
    setNotice(null);
    setTyped("");
    setPendingConfirm(null);
    setIsSpellingActive(false);
    return say(questionFor(i, fs, qs, l), l);
  }

  async function ensureQuestions(fs: Field[], l: Lang, qs: QMap): Promise<QMap> {
    if (qs[l] && fs.every((f) => qs[l]![f.id])) return qs;
    try {
      const res = await api.questions(fs.map(brief), l);
      const map = { ...(qs[l] ?? {}) };
      for (const q of res.questions) map[q.id] = q.question;
      const next = { ...qs, [l]: map };
      setQuestions(next);
      return next;
    } catch {
      return qs; // fall back to field labels
    }
  }

  function reset() {
    stopSpeaking();
    recorder.current?.cancel();
    recorder.current = null;
    pdfBytes.current = null;
    setIsHandsFreePaused(false);
    isPausedRef.current = false;
    isAutoStoppingRef.current = false;
    processingLockRef.current = false;
    setStage("home");
    setFields([]);
    setQuestions({});
    setValues({});
    setSkipped({});
    setIdx(0);
    setPhase("idle");
    setAssistant("");
    setHeard("");
    setExplanation(null);
    setNotice(null);
    setError(null);
    setPendingConfirm(null);
    setIsSpellingActive(false);
    setEvaluation(null);
    setIsEvaluating(false);
    setAnnouncement("");
  }

  async function begin(fs: Field[], qs: QMap, formTitle: string) {
    setFields(fs);
    setQuestions(qs);
    setTitle(formTitle);
    setValues({});
    setSkipped({});
    setStage("talk");
    await ask(0, fs, qs, lang);
  }

  async function openSample(s: Sample) {
    setError(null);
    setStage("loading");
    setLoadingMsg(t("reading", lang));
    try {
      const res = await fetch(s.url);
      if (!res.ok) throw new Error("Could not load the sample form.");
      pdfBytes.current = new Uint8Array(await res.arrayBuffer());
      const { fields: fs, questions: qs } = sampleFields(s);
      const sampleTitle = lang === "en" ? s.title : lang === "kn" ? (s.titleKn || s.title) : s.titleHi;
      await begin(fs, qs, sampleTitle);
    } catch (e) {
      setError((e as Error).message);
      setStage("home");
    }
  }

  async function openFile(file: File) {
    setError(null);
    if (file.type && file.type !== "application/pdf") return setError("Please choose a PDF file.");
    if (file.size > MAX_PDF_BYTES) return setError("This PDF is larger than 10 MB.");
    setStage("loading");
    setLoadingMsg(t("reading", lang));
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      pdfBytes.current = bytes;
      const parsed = await parsePdf(bytes);
      if (parsed.acro.length === 0 && parsed.lines.length < 3) throw new Error(t("scanned", lang));
      const extracted = await api.extract(
        parsed.acro.length > 0
          ? { mode: "acro", fields: parsed.acro, text: parsed.text }
          : { mode: "text", lines: parsed.lines.map((l) => ({ id: l.id, text: l.text.slice(0, 500) })) },
      );
      const fs = placeFields(extracted.fields, parsed);
      if (fs.length === 0) throw new Error(t("noFields", lang));
      setLoadingMsg(t("preparing", lang));
      const qs = await ensureQuestions(fs, lang, {});
      await begin(fs, qs, extracted.title || file.name.replace(/\.pdf$/i, ""));
    } catch (e) {
      setError((e as Error).message);
      setStage("home");
    }
  }

  async function changeLang(l: Lang) {
    if (l === lang) return;
    setLang(l);
    if (stage !== "talk") return;
    stopSpeaking();
    setPhase("thinking");
    const qs = await ensureQuestions(fields, l, questions);
    await ask(idx, fields, qs, l);
  }

  async function runEvaluation(curFields = fields, curValues = values) {
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: curFields.map(brief),
          values: curValues,
          lang,
        }),
      });
      if (res.ok) {
        const result: FormEvaluationResult = await res.json();
        setEvaluation(result);
        if (result.say) {
          await say(result.say, lang);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsEvaluating(false);
    }
  }

  async function finish() {
    setStage("done");
    setIdx(-1);
    stopSpeaking();
    await say(t("doneSay", lang));
    await runEvaluation();
  }

  async function advance(from: number, vals: Record<string, string>, skp: Record<string, boolean>) {
    const i = nextOpen(from, fields, vals, skp);
    if (i < 0) return finish();
    return ask(i);
  }

  async function confirmAnswer(overrideValue?: string) {
    if (!pendingConfirm) return;
    const val = (overrideValue ?? pendingConfirm.value).trim();
    if (!val) return;
    const field = fields[idx];
    if (!field) return;

    playEarcon("success");
    const vals = { ...values, [field.id]: val };
    const skp = { ...skipped };
    delete skp[field.id];
    setValues(vals);
    setSkipped(skp);
    setLastFilled(field.id);
    setPendingConfirm(null);
    await say(t("confirmedSay", lang));
    return advance(idx, vals, skp);
  }

  async function rejectAnswer() {
    playEarcon("alert");
    setPendingConfirm(null);
    await say(t("retrySay", lang));
    const q = questionFor(idx, fields, questions, lang);
    return say(q, lang);
  }

  function buildConfirmMessage(f: FieldBrief, val: string, l: Lang): string {
    const prefix = t("confirmSayPrefix", l);
    const suffix = t("confirmSaySuffix", l);
    if (f.type === "name" || f.type === "ifsc") {
      const spelled = characterReadout(val);
      return `${prefix} "${val}", ${t("spelledAs", l)}: ${spelled}. ${suffix}`;
    }
    if (["phone", "aadhaar", "pincode", "account"].includes(f.type)) {
      const digits = digitReadout(val);
      return `${prefix} "${val}", ${t("digitsAs", l)}: ${digits}. ${suffix}`;
    }
    return `${prefix} "${val}". ${suffix}`;
  }

  async function handleAnswer(answer: string) {
    const field = fields[idx];
    if (!field || !answer.trim()) return;
    setHeard(answer);
    setExplanation(null);
    setNotice(null);
    setPhase("thinking");

    // 1. Hands-Free Voice Navigation Command routing
    const navCmd = parseVoiceNavigationCommand(answer);
    if (navCmd) {
      if (navCmd.type === "NEXT" && idx < fields.length - 1) {
        setPendingConfirm(null);
        await say(t("navigatingNext", lang));
        return ask(idx + 1);
      }
      if (navCmd.type === "PREVIOUS" && idx > 0) {
        setPendingConfirm(null);
        await say(t("navigatingBack", lang));
        return ask(idx - 1);
      }
      if (navCmd.type === "REPEAT_QUESTION") {
        return say(questionFor(idx, fields, questions, lang), lang);
      }
      if (navCmd.type === "REPEAT_ANSWER") {
        if (pendingConfirm) {
          return say(buildConfirmMessage(brief(field), pendingConfirm.value, lang), lang);
        }
        if (values[field.id]) {
          return say(`${t("confirmSayPrefix", lang)}: ${values[field.id]}`, lang);
        }
      }
      if (navCmd.type === "CORRECT") {
        if (pendingConfirm) return rejectAnswer();
        if (values[field.id]) {
          const vals = { ...values };
          delete vals[field.id];
          setValues(vals);
          return ask(idx);
        }
      }
      if (navCmd.type === "SPELL") {
        setIsSpellingActive(true);
        return say(
          lang === "kn"
            ? "ಸ್ಪೆಲ್ಲಿಂಗ್ ಮೋಡ್ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ."
            : lang === "hi"
              ? "स्पेलिंग मोड शुरू हो गया है।"
              : "Spelling mode activated. Please speak letters or words.",
          lang
        );
      }
      if (navCmd.type === "SKIP") {
        if (!field.required) {
          return onSkip();
        } else {
          return say(
            lang === "kn"
              ? "ಈ ಕಾಲಂ ಕಡ್ಡಾಯವಾಗಿದೆ, ಬಿಡಲು ಸಾಧ್ಯವಿಲ್ಲ."
              : lang === "hi"
                ? "यह खाना अनिवार्य है, इसे छोड़ नहीं सकते।"
                : "This field is required and cannot be skipped.",
            lang
          );
        }
      }
      if (navCmd.type === "READ_ALL") {
        const filled = fields.filter((f) => values[f.id]);
        if (filled.length === 0) {
          return say(
            lang === "kn"
              ? "ಇನ್ನೂ ಯಾವುದೇ ಕಾಲಂ ಭರ್ತಿಯಾಗಿಲ್ಲ."
              : lang === "hi"
                ? "अभी तक कोई खाना नहीं भरा गया है।"
                : "No fields have been filled yet.",
            lang
          );
        }
        let speech = `${t("readAllTitle", lang)}. `;
        for (const f of filled) {
          speech += `${f.label.replace(/^\d+\.\s*/, "")}: ${values[f.id]}. `;
        }
        speech += t("readoutDone", lang);
        return say(speech, lang);
      }
      if (navCmd.type === "SUBMIT" || navCmd.type === "REVIEW") {
        const missingReq = fields.filter((f) => f.required && !values[f.id]);
        if (missingReq.length === 0) {
          setStage("done");
          return say(t("submitPrompt", lang), lang);
        } else {
          return say(
            lang === "kn"
              ? "ದಯವಿಟ್ಟು ಮೊದಲು ಎಲ್ಲಾ ಅಗತ್ಯ ಕಾಲಂಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ."
              : lang === "hi"
                ? "कृपया पहले सभी अनिवार्य खाने भरें।"
                : "Please fill all required fields before submitting.",
            lang
          );
        }
      }
      if (navCmd.type === "PAUSE") {
        setIsHandsFreePaused(true);
        isPausedRef.current = true;
        playEarcon("alert");
        return say(t("handsFreePausedPrompt", lang), lang);
      }
      if (navCmd.type === "RESUME") {
        setIsHandsFreePaused(false);
        isPausedRef.current = false;
        playEarcon("success");
        await say(t("handsFreeResumedPrompt", lang), lang);
        return ask(idx);
      }
    }

    // 2. Check for voice command activating spelling mode
    const spellCmd = parseSpellingVoiceCommand(answer);
    if (spellCmd === "spell" && !isSpellingActive) {
      setIsSpellingActive(true);
      const prompt =
        lang === "kn"
          ? "ಸ್ಪೆಲ್ಲಿಂಗ್ ಮೋಡ್ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ. ಅಕ್ಷರಗಳು ಅಥವಾ ಪದಗಳನ್ನು ಹೇಳಿ."
          : lang === "hi"
            ? "स्पेलिंग मोड शुरू हो गया है। कृपया अक्षर या शब्द बोलिए।"
            : "Spelling mode activated. Please speak letters or characters.";
      return say(prompt, lang);
    }

    // 3. If currently confirming an answer, evaluate response as confirmation or correction
    if (pendingConfirm && pendingConfirm.fieldId === field.id) {
      if (isAffirmative(answer)) {
        return confirmAnswer();
      }
      if (isNegative(answer)) {
        return rejectAnswer();
      }
      // If user speaks a new answer directly, fall through to re-normalize
    }

    // 4. If spelling mode is active, use deterministic character/digit parsing without LLM distortion:
    if (isSpellingActive) {
      let parsedVal = "";
      if (field.type === "email") {
        parsedVal = parseSpokenEmail(answer);
      } else if (["phone", "aadhaar", "pincode", "account", "number"].includes(field.type)) {
        parsedVal = parseSpokenDigits(answer);
      } else {
        parsedVal = parseSpokenCharacters(answer);
      }

      if (parsedVal) {
        setIsSpellingActive(false);
        setPendingConfirm({
          fieldId: field.id,
          value: parsedVal,
          originalAnswer: answer,
        });
        const confirmMsg = buildConfirmMessage(brief(field), parsedVal, lang);
        return say(confirmMsg, lang);
      }
    }

    let res;
    try {
      res = await api.normalize(brief(field), answer, lang);
    } catch {
      res = { status: "ok" as const, value: localNormalize(brief(field), answer), say: "" };
      setNotice(t("offline", lang));
    }

    if (res.status === "skip" && !field.required) {
      const skp = { ...skipped, [field.id]: true };
      setSkipped(skp);
      setPendingConfirm(null);
      if (res.say) await say(res.say);
      return advance(idx, values, skp);
    }
    if (res.status !== "ok" || !res.value) {
      setPendingConfirm(null);
      return say(res.say || t("again", lang));
    }

    const err = validate(brief(field), res.value, lang);
    if (err) {
      setPendingConfirm(null);
      return say(err);
    }

    // Trigger spoken confirmation WITH SPELLING / DIGIT READOUT!
    setPendingConfirm({
      fieldId: field.id,
      value: res.value,
      originalAnswer: answer,
    });

    const confirmMsg = buildConfirmMessage(brief(field), res.value, lang);
    return say(confirmMsg, lang);
  }

  async function handleAutoStop() {
    const rec = recorder.current;
    if (!rec) return;
    recorder.current = null;
    processingLockRef.current = true;
    setPhase("thinking");
    playEarcon("processing");

    try {
      const blob = await rec.stop();
      if (blob.size < 1200) {
        processingLockRef.current = false;
        playEarcon("alert");
        return say(t("again", lang));
      }
      const text = await api.transcribe(blob, `answer.${extFor(rec.mime)}`, lang);
      if (!text.trim()) {
        processingLockRef.current = false;
        playEarcon("alert");
        return say(t("again", lang));
      }
      processingLockRef.current = false;
      await handleAnswer(text);
    } catch (e) {
      processingLockRef.current = false;
      playEarcon("alert");
      setNotice((e as Error).message);
      setPhase("idle");
      if (handsFreeRef.current && !isPausedRef.current && stageRef.current === "talk") {
        setTimeout(() => triggerAutoListen(), 1200);
      }
    }
  }

  async function triggerAutoListen() {
    if (!handsFreeRef.current || isPausedRef.current || stageRef.current !== "talk") return;
    if (phaseRef.current === "listening" || phaseRef.current === "thinking" || processingLockRef.current) return;

    stopSpeaking();
    try {
      playEarcon("listen");
      setPhase("listening");
      setSpeechDetected(false);
      isAutoStoppingRef.current = false;

      const rec = await startRecording({
        autoStopOnSilence: true,
        silenceDurationMs: 1300,
        minSpeechDurationMs: 400,
        onSpeechDetected: () => {
          setSpeechDetected(true);
        },
        onSilence: async () => {
          if (isAutoStoppingRef.current || processingLockRef.current) return;
          isAutoStoppingRef.current = true;
          await handleAutoStop();
        },
      });
      recorder.current = rec;
    } catch {
      setNotice(t("noMic", lang));
      setPhase("idle");
    }
  }

  async function onMic() {
    if (phase === "listening" && recorder.current) {
      isAutoStoppingRef.current = true;
      await handleAutoStop();
      return;
    }
    stopSpeaking();
    setIsHandsFreePaused(false);
    isPausedRef.current = false;
    await triggerAutoListen();
  }

  async function onExplain() {
    const field = fields[idx];
    if (!field) return;
    stopSpeaking();
    setExplanation("…");
    try {
      const res = await api.explain(field.label.replace(/^\d+\.\s*/, ""), title, lang);
      setExplanation(res.explanation);
      setPhase("speaking");
      await speak(res.explanation, lang);
      setPhase((p) => (p === "speaking" ? "idle" : p));
    } catch (e) {
      setExplanation((e as Error).message);
    }
  }

  function onSkip() {
    const field = fields[idx];
    if (!field || field.required) return;
    stopSpeaking();
    setPendingConfirm(null);
    const skp = { ...skipped, [field.id]: true };
    setSkipped(skp);
    advance(idx, values, skp);
  }

  function onBack() {
    if (idx > 0) {
      stopSpeaking();
      setPendingConfirm(null);
      ask(idx - 1);
    }
  }

  function onPick(i: number) {
    recorder.current?.cancel();
    recorder.current = null;
    stopSpeaking();
    setPendingConfirm(null);
    setStage("talk");
    ask(i);
  }

  async function onDownload() {
    if (!pdfBytes.current) return;
    setDownloading(true);
    try {
      const out = await fillPdf(pdfBytes.current, fields, values);
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "form").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "form"}-filled.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  const filledCount = fields.filter((f) => values[f.id]).length;
  const current = fields[idx];
  const missing = fields.filter((f) => f.required && !values[f.id]);
  const micLabel = isHandsFreePaused
    ? t("handsFreePausedPrompt", lang)
    : phase === "listening"
      ? speechDetected
        ? "👂 Listening… pause when done"
        : handsFree
          ? "🎙️ Listening hands-free… speak answer"
          : t("tapToStop", lang)
      : phase === "thinking"
        ? t("thinking", lang)
        : phase === "speaking"
          ? t("speaking", lang)
          : pendingConfirm
            ? t("confirmPrompt", lang)
            : handsFree
              ? "🟢 Hands-Free Ready (Say answer)"
              : t("tapToTalk", lang);

  if (isOrgPortalOpen) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3 py-4">
          <button type="button" onClick={() => setIsOrgPortalOpen(false)} className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-accent">
            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-ink">
              🗣️
            </span>
            <div className="flex flex-col text-left">
              <span className="font-display text-2xl font-semibold tracking-tight">FormSathi <span className="text-accent">AI</span></span>
              <span className="text-[11px] font-medium text-muted">Organisation Form Portal</span>
            </div>
          </button>
        </header>

        <OrgFormBuilder
          onOpenFormToFill={(formDef) => {
            setIsOrgPortalOpen(false);
            const fs: Field[] = formDef.fields.map((f, i) => ({
              ...f,
              placement: { kind: "overlay", page: 1, x: 50, y: 700 - i * 35, size: 10 },
            }));
            const qs: QMap = (formDef.translations as QMap) || {};
            begin(fs, qs, formDef.title);
          }}
          onBack={() => setIsOrgPortalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 sm:px-6">
      {/* Screen reader assertive announcer for blind users */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>

      <header className="flex flex-wrap items-center justify-between gap-3 py-4">
        <button type="button" onClick={reset} className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-accent">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-ink">
            🗣️
          </span>
          <div className="flex flex-col text-left">
            <span className="font-display text-2xl font-semibold tracking-tight">FormSathi <span className="text-accent">AI</span></span>
            {user && <span className="text-[11px] font-medium text-muted">Welcome, {user.name}</span>}
          </div>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {/* Location-aware Regional Language Recommender */}
          <LocationLanguageSuggester currentLang={lang} onSelectLang={changeLang} />

          <button
            type="button"
            onClick={() => {
              const next = !handsFree;
              setHandsFree(next);
              if (!next && phase === "listening") {
                recorder.current?.cancel();
                setPhase("idle");
              }
            }}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              handsFree
                ? "border-2 border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border border-line bg-card text-muted hover:text-ink"
            }`}
            aria-pressed={handsFree}
            aria-label="Toggle Hands-Free Voice Mode for blind navigation"
            title={t("handsFreeDesc", lang)}
          >
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${handsFree ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
            <span>{handsFree ? t("handsFreeOn", lang) : t("handsFreeOff", lang)}</span>
          </button>

          <div role="radiogroup" aria-label="Language" className="flex rounded-full border border-line bg-card p-1">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={lang === l}
                onClick={() => changeLang(l)}
                className={`rounded-full px-3 py-1.5 text-base font-medium transition-colors sm:px-4 ${
                  lang === l ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <PrivacyBanner onClearSession={reset} />

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-danger/40 bg-card px-4 py-3 text-base text-danger">
          {error}
        </div>
      )}

      {stage === "home" && (
        <main className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <h1 className="font-display max-w-2xl text-4xl leading-tight font-semibold sm:text-5xl">{t("tagline", lang)}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted sm:text-xl">{t("sub", lang)}</p>

          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) openFile(f);
            }}
          />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full max-w-lg">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex-1 min-w-[200px] rounded-2xl bg-accent px-6 py-5 text-xl font-semibold text-accent-ink shadow-md transition-transform focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
            >
              📄 {t("upload", lang)}
            </button>

            {user && (
              <button
                type="button"
                onClick={() => setIsOrgPortalOpen(true)}
                className="flex-1 min-w-[200px] rounded-2xl border-2 border-line bg-card px-6 py-5 text-lg font-bold text-ink shadow-2xs hover:border-accent transition-transform active:scale-[0.98]"
              >
                🏢 Org Form Builder & QR
              </button>
            )}
          </div>

          <p className="mt-6 text-base text-muted">{t("orTry", lang)}</p>
          <div className="mt-3 grid w-full max-w-sm gap-3 sm:max-w-xl sm:grid-cols-2">
            {SAMPLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => openSample(s)}
                className="rounded-2xl border-2 border-line bg-card px-5 py-4 text-left transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span className="block text-lg font-semibold">{lang === "en" ? s.title : lang === "kn" ? (s.titleKn || s.title) : s.titleHi}</span>
                <span className="block text-sm text-muted">{s.fields.length} fields · sample</span>
              </button>
            ))}
          </div>

          <p className="mt-8 flex max-w-md items-center gap-2 rounded-full bg-ok-soft px-4 py-2 text-sm text-ok">
            <span aria-hidden>🔒</span> {t("privacy", lang)}
          </p>
        </main>
      )}

      {stage === "loading" && (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 py-16" aria-busy>
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-xl">{loadingMsg}</p>
        </main>
      )}

      {(stage === "talk" || stage === "done") && (
        <div className="flex flex-1 flex-col">
          {stage === "talk" && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Form completion mode" className="flex items-center gap-1 rounded-2xl border border-line bg-card p-1 shadow-2xs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={formMode === "visual"}
                  onClick={() => {
                    setFormMode("visual");
                    stopSpeaking();
                    recorder.current?.cancel();
                    setPhase("idle");
                    setAnnouncement("Switched to Visual Form mode.");
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    formMode === "visual" ? "bg-ink text-paper shadow-2xs" : "text-muted hover:text-ink"
                  }`}
                >
                  <span>📋</span>
                  <span>Visual Form</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={formMode === "voice"}
                  onClick={() => {
                    setFormMode("voice");
                    setHandsFree(false);
                    handsFreeRef.current = false;
                    stopSpeaking();
                    recorder.current?.cancel();
                    setPhase("idle");
                    setAnnouncement("Switched to Voice-Assisted mode.");
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    formMode === "voice" ? "bg-ink text-paper shadow-2xs" : "text-muted hover:text-ink"
                  }`}
                >
                  <span>🎙️</span>
                  <span>Voice-Assisted</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={formMode === "conversational"}
                  onClick={() => {
                    setFormMode("conversational");
                    setHandsFree(true);
                    handsFreeRef.current = true;
                    setIsHandsFreePaused(false);
                    isPausedRef.current = false;
                    setAnnouncement("Switched to Hands-Free Conversational Voice mode.");
                    say(questionFor(idx, fields, questions, lang), lang);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    formMode === "conversational" ? "bg-emerald-600 text-white shadow-2xs" : "text-muted hover:text-ink"
                  }`}
                >
                  <span>💬</span>
                  <span>Fully Conversational</span>
                </button>
              </div>

              <span className="text-xs font-medium text-muted">
                {formMode === "conversational"
                  ? "🟢 Zero Tapping · Auto-listen loop active"
                  : formMode === "voice"
                    ? "🎙️ Tap Mic to Answer Each Field"
                    : "📋 Direct On-Screen Entry"}
              </span>
            </div>
          )}

          {formMode === "visual" && stage === "talk" ? (
            <VisualForm
              fields={fields}
              values={values}
              lang={lang}
              onChangeValue={(id, val) => {
                setValues((prev) => ({ ...prev, [id]: val }));
                setLastFilled(id);
              }}
              onSubmit={finish}
              onSwitchMode={(m) => {
                setFormMode(m);
                if (m === "conversational") {
                  setHandsFree(true);
                  handsFreeRef.current = true;
                  say(questionFor(idx, fields, questions, lang), lang);
                }
              }}
            />
          ) : (
            <main className="grid flex-1 items-start gap-6 md:grid-cols-[1.15fr_1fr]">
          <section className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-7 md:sticky md:top-4">
            <div className="mb-5">
              <div className="flex justify-between text-sm text-muted">
                <span>
                  {filledCount} {t("of", lang)} {fields.length} {t("filled", lang)}
                </span>
                <span>{Math.round((filledCount / Math.max(1, fields.length)) * 100)}%</span>
              </div>
              <div
                className="mt-1.5 h-3 overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={fields.length}
                aria-valuenow={filledCount}
              >
                <div className="h-full rounded-full bg-ok transition-all duration-500" style={{ width: `${(filledCount / Math.max(1, fields.length)) * 100}%` }} />
              </div>
            </div>

            {stage === "talk" && current && (
              <>
                <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                  {idx + 1} / {fields.length} · {current.label.replace(/^\d+\.\s*/, "")}
                </p>
                <p className="mt-2 text-2xl leading-snug font-semibold sm:text-3xl" aria-live="polite">
                  {assistant}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => say(assistant)}
                    className="rounded-full border border-line px-4 py-2 text-base hover:border-accent"
                  >
                    🔁 {t("repeat", lang)}
                  </button>
                  <button
                    type="button"
                    onClick={onExplain}
                    className="rounded-full border border-line px-4 py-2 text-base hover:border-accent"
                  >
                    ❓ {t("whatMeans", lang)}
                  </button>
                  {["name", "text", "email", "phone", "aadhaar", "pincode", "ifsc", "account"].includes(current.type) && (
                    <button
                      type="button"
                      onClick={() => setIsSpellingActive(!isSpellingActive)}
                      className={`rounded-full border px-4 py-2 text-base transition-colors ${
                        isSpellingActive ? "border-accent bg-accent text-accent-ink" : "border-line hover:border-accent"
                      }`}
                    >
                      {t("spellModeBtn", lang)}
                    </button>
                  )}
                </div>

                {isSpellingActive && (
                  <SpellingAssistant
                    field={current}
                    initialValue={pendingConfirm?.value || values[current.id] || ""}
                    lang={lang}
                    speakText={(txt) => speak(txt, lang, 0.75)}
                    onClose={() => setIsSpellingActive(false)}
                    onApply={(newVal) => {
                      setIsSpellingActive(false);
                      setPendingConfirm({
                        fieldId: current.id,
                        value: newVal,
                        originalAnswer: newVal,
                      });
                      const confirmPrompt = `${t("confirmSayPrefix", lang)} "${newVal}". ${t("confirmSaySuffix", lang)}`;
                      say(confirmPrompt, lang);
                    }}
                  />
                )}

                {explanation && (
                  <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-lg leading-relaxed" aria-live="polite">
                    {explanation}
                  </p>
                )}

                {pendingConfirm && (
                  <div
                    role="region"
                    aria-label={t("confirmTitle", lang)}
                    className="my-5 rounded-2xl border-2 border-accent bg-accent-soft/30 p-5 shadow-sm animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-accent">
                        👂 {t("confirmTitle", lang)}
                      </span>
                      <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent">
                        {t("confirmPrompt", lang)}
                      </span>
                    </div>

                    <div className="mt-3">
                      <label htmlFor="confirm-edit-val" className="block text-xs font-medium text-muted mb-1">
                        Recognized answer (tap to edit manually if needed):
                      </label>
                      <input
                        id="confirm-edit-val"
                        type="text"
                        value={pendingConfirm.value}
                        onChange={(e) => setPendingConfirm({ ...pendingConfirm, value: e.target.value })}
                        className="w-full rounded-xl border-2 border-accent bg-card px-4 py-3 text-2xl font-bold text-ink shadow-2xs focus-visible:outline-2 focus-visible:outline-accent"
                      />
                    </div>

                    <p className="mt-2 text-sm text-muted">
                      {t("confirmSayPrefix", lang)} <strong>&ldquo;{pendingConfirm.value}&rdquo;</strong>. {t("confirmSaySuffix", lang)}
                    </p>

                    {(current.type === "name" || current.type === "ifsc") && (
                      <p className="mt-1.5 text-xs font-mono font-semibold text-accent bg-card/60 p-2 rounded-lg border border-line">
                        🔤 {t("spelledAs", lang)}: {characterReadout(pendingConfirm.value)}
                      </p>
                    )}

                    {(["phone", "aadhaar", "pincode", "account"].includes(current.type)) && (
                      <p className="mt-1.5 text-xs font-mono font-semibold text-accent bg-card/60 p-2 rounded-lg border border-line">
                        🔢 {t("digitsAs", lang)}: {digitReadout(pendingConfirm.value)} ({formatNumberChunks(pendingConfirm.value, current.type)})
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => confirmAnswer()}
                        className="flex-1 rounded-xl bg-ok px-5 py-3 text-base font-bold text-white shadow-xs transition hover:opacity-90 active:scale-98 focus-visible:outline-2 focus-visible:outline-ok"
                      >
                        {t("confirmYes", lang)}
                      </button>
                      <button
                        type="button"
                        onClick={rejectAnswer}
                        className="flex-1 rounded-xl border-2 border-danger bg-card px-5 py-3 text-base font-bold text-danger transition hover:bg-danger/10 active:scale-98 focus-visible:outline-2 focus-visible:outline-danger"
                      >
                        {t("confirmNo", lang)}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const confirmMsg = buildConfirmMessage(brief(current), pendingConfirm.value, lang);
                          say(confirmMsg, lang);
                        }}
                        className="rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold text-muted hover:bg-line/40 hover:text-ink"
                      >
                        🔁 {t("repeat", lang)}
                      </button>
                    </div>
                  </div>
                )}

                <div className="my-6 flex flex-col items-center">
                  {handsFree && !isHandsFreePaused && (
                    <div className="mb-3 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Hands-Free Active · No tapping needed · Space = Pause</span>
                    </div>
                  )}

                  {handsFree && isHandsFreePaused && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-warn/40 bg-warn-soft px-4 py-2 text-xs font-semibold text-warn">
                      <span>⏸️ {t("handsFreePausedPrompt", lang)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsHandsFreePaused(false);
                          isPausedRef.current = false;
                          triggerAutoListen();
                        }}
                        className="rounded-lg bg-warn px-2.5 py-1 text-xs font-bold text-white hover:opacity-90"
                      >
                        Resume
                      </button>
                    </div>
                  )}

                  <MicButton listening={phase === "listening"} busy={phase === "thinking"} label={micLabel} onClick={onMic} />
                </div>

                {heard && (
                  <p className="mb-3 text-base text-muted">
                    {t("youSaid", lang)}: <span className="text-ink">“{heard}”</span>
                  </p>
                )}
                {notice && <p className="mb-3 rounded-lg bg-warn-soft px-3 py-2 text-base text-warn">{notice}</p>}

                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = typed.trim();
                    if (v) {
                      stopSpeaking();
                      setTyped("");
                      handleAnswer(v);
                    }
                  }}
                >
                  <label className="sr-only" htmlFor="typed">
                    {t("typeInstead", lang)}
                  </label>
                  <input
                    id="typed"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={t("typeInstead", lang)}
                    disabled={phase === "thinking" || phase === "listening"}
                    className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-3 text-lg outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!typed.trim() || phase === "thinking"}
                    className="rounded-xl bg-ink px-5 text-lg font-semibold text-paper disabled:opacity-40"
                  >
                    {t("send", lang)}
                  </button>
                </form>

                <div className="mt-4 flex justify-between">
                  <button type="button" onClick={onBack} disabled={idx === 0} className="px-2 py-2 text-base text-muted disabled:opacity-30">
                    ← {t("back", lang)}
                  </button>
                  {!current.required && (
                    <button type="button" onClick={onSkip} className="px-2 py-2 text-base text-muted">
                      {t("skip", lang)} →
                    </button>
                  )}
                </div>
              </>
            )}

            {stage === "done" && (
              <div className="text-center">
                <p className="text-5xl" aria-hidden>
                  🎉
                </p>
                <h2 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">{t("doneTitle", lang)}</h2>

                {isEvaluating && (
                  <div className="my-4 flex items-center justify-center gap-2 rounded-xl bg-accent-soft/40 p-3.5 text-xs font-semibold text-accent animate-pulse" aria-busy>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                    <span>Evaluating all form answers for consistency & format verification…</span>
                  </div>
                )}

                {evaluation && (
                  <div
                    role="region"
                    aria-label="AI Form Evaluation"
                    className={`my-4 rounded-xl border p-4 text-left shadow-2xs ${
                      evaluation.valid ? "border-ok/40 bg-ok-soft/30" : "border-warn/40 bg-warn-soft/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{evaluation.valid ? "✅" : "⚠️"}</span>
                        <span className="font-bold text-ink text-sm">
                          AI Verification Score: {evaluation.score}%
                        </span>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        evaluation.valid ? "bg-ok text-white" : "bg-warn text-white"
                      }`}>
                        {evaluation.valid ? "Verified & Consistent" : "Review Warnings"}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs text-ink font-medium">
                      {evaluation.summary}
                    </p>

                    {evaluation.issues.length > 0 && (
                      <ul className="mt-2.5 space-y-1 text-[11px] text-muted border-t border-line/60 pt-2">
                        {evaluation.issues.map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span>{issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "✓"}</span>
                            <span>
                              <strong>{issue.label}:</strong> {issue.message}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {missing.length > 0 && (
                  <p className="mt-3 text-base text-warn">
                    {t("missing", lang)}: {missing.map((f) => f.label.replace(/^\d+\.\s*/, "")).join(", ")}
                  </p>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    const filled = fields.filter((f) => values[f.id]);
                    if (filled.length === 0) return;
                    let speech = `${t("readAllTitle", lang)}. `;
                    for (const f of filled) {
                      speech += `${f.label.replace(/^\d+\.\s*/, "")}: ${values[f.id]}. `;
                    }
                    speech += t("readoutDone", lang);
                    await say(speech, lang);
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-card py-3 text-base font-semibold text-ink shadow-2xs transition hover:border-accent"
                >
                  <span>🔊 Read All Answers Aloud</span>
                </button>

                <div className="mt-5 text-left rounded-xl border border-line bg-paper/60 p-4 max-h-64 overflow-y-auto">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Review Form Responses</h3>
                  <ul className="divide-y divide-line text-sm">
                    {fields.map((f, i) => (
                      <li key={f.id} className="py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="block font-medium text-ink truncate">{f.label.replace(/^\d+\.\s*/, "")}</span>
                          <span className="block text-xs font-mono text-accent truncate">
                            {values[f.id] || <em className="text-muted">Skipped / blank</em>}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onPick(i)}
                          className="rounded-md border border-line bg-card px-2.5 py-1 text-xs font-bold text-accent hover:border-accent transition"
                          title={`Edit ${f.label}`}
                        >
                          Edit
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onDownload}
                  disabled={downloading}
                  className="mt-6 w-full rounded-2xl bg-accent px-6 py-5 text-xl font-semibold text-accent-ink shadow-md active:scale-[0.98] disabled:opacity-60"
                >
                  {downloading ? "…" : `⬇️ ${t("download", lang)}`}
                </button>
                <button type="button" onClick={reset} className="mt-3 w-full rounded-2xl border border-line px-6 py-3 text-lg">
                  {t("startOver", lang)}
                </button>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-muted">🔒 {t("privacy", lang)}</p>
          </section>

          <FormPreview
            title={title}
            fields={fields}
            values={values}
            skipped={skipped}
            current={stage === "talk" ? idx : null}
            lastFilled={lastFilled}
            pendingFieldId={pendingConfirm?.fieldId}
            pendingValue={pendingConfirm?.value}
            lang={lang}
            onPick={onPick}
          />
        </main>
      )}
    </div>
  )}

      <footer className="mt-10 text-center text-sm text-muted">
        {t("builtWith", lang)} · FormSathi AI
      </footer>
    </div>
  );
}
