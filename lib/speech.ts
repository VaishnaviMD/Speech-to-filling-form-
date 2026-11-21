import type { Lang } from "./types";

const BCP47: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  hinglish: "en-IN",
  kn: "kn-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  gu: "gu-IN",
};

function pickVoice(lang: Lang) {
  const voices = window.speechSynthesis.getVoices();
  const want = BCP47[lang].toLowerCase();
  const base = want.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === want) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base)) ??
    (lang === "hinglish" ? voices.find((v) => v.lang.toLowerCase() === "hi-in") : undefined) ??
    voices.find((v) => v.lang.toLowerCase() === "en-in") ??
    voices.find((v) => v.lang.toLowerCase().includes("in"))
  );
}

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Speak text with the browser's built-in TTS. Resolves when finished (or immediately if unsupported). */
export function speak(text: string, lang: Lang, rate = 0.92): Promise<void> {
  if (!canSpeak() || !text) return Promise.resolve();
  const synth = window.speechSynthesis;
  synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BCP47[lang];
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

// Voices load asynchronously in Chrome; touch the list early so the first question gets the right one.
export function warmVoices() {
  if (!canSpeak()) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

export type Recorder = { stop: () => Promise<Blob>; cancel: () => void; mime: string };

export interface RecordingOptions {
  autoStopOnSilence?: boolean;
  silenceDurationMs?: number;
  minSpeechDurationMs?: number;
  maxDurationMs?: number;
  onSilence?: () => void;
  onSpeechDetected?: () => void;
}

export async function startRecording(options?: RecordingOptions): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(
    (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
  );
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();

  let vadInterval: ReturnType<typeof setInterval> | null = null;
  let audioCtx: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;

  const cleanupVAD = () => {
    if (vadInterval) {
      clearInterval(vadInterval);
      vadInterval = null;
    }
    try {
      source?.disconnect();
      analyser?.disconnect();
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    } catch {}
  };

  if (options?.autoStopOnSilence) {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }
        source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let hasSpoken = false;
        let speechStartTime = 0;
        let silenceStartTime = 0;
        const startTime = Date.now();
        const silenceDuration = options.silenceDurationMs ?? 1300;
        const minSpeechDuration = options.minSpeechDurationMs ?? 400;
        const maxDuration = options.maxDurationMs ?? 15000;

        vadInterval = setInterval(() => {
          if (rec.state !== "recording") {
            cleanupVAD();
            return;
          }

          analyser?.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;

          // Background ambient noise is typically 2-10; human voice registers 18+
          const threshold = 18;

          if (avg > threshold) {
            if (!hasSpoken) {
              hasSpoken = true;
              speechStartTime = Date.now();
              options.onSpeechDetected?.();
            }
            silenceStartTime = 0;
          } else if (hasSpoken) {
            const now = Date.now();
            if (!silenceStartTime) {
              silenceStartTime = now;
            } else if (now - silenceStartTime >= silenceDuration && now - speechStartTime >= minSpeechDuration) {
              cleanupVAD();
              options.onSilence?.();
              return;
            }
          }

          if (Date.now() - startTime >= maxDuration) {
            cleanupVAD();
            options.onSilence?.();
          }
        }, 60);
      }
    } catch (err) {
      console.warn("VAD setup skipped:", err);
    }
  }

  const release = () => {
    cleanupVAD();
    stream.getTracks().forEach((t) => t.stop());
  };

  return {
    mime: rec.mimeType || mime || "audio/webm",
    stop: () =>
      new Promise((resolve) => {
        rec.onstop = () => {
          release();
          resolve(new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }));
        };
        if (rec.state !== "inactive") {
          rec.stop();
        } else {
          release();
          resolve(new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }));
        }
      }),
    cancel: () => {
      rec.onstop = null;
      if (rec.state !== "inactive") rec.stop();
      release();
    },
  };
}

export function extFor(mime: string) {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}
