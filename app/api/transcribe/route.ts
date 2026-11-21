import { errorResponse } from "@/lib/api";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { transcribe } from "@/lib/groq";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel request bodies cap at ~4.5 MB

const HINTS: Record<string, string> = {
  hi: "उत्तर हिंदी में है। नाम, तारीख, मोबाइल नंबर, आधार नंबर।",
  hinglish: "Hinglish answer in Roman script. Mera naam, date of birth, mobile number.",
  en: "An answer for a form: name, date of birth, phone number, address.",
  kn: "ಉತ್ತರ ಕನ್ನಡದಲ್ಲಿದೆ. ಹೆಸರು, ದಿನಾಂಕ, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಆಧಾರ್ ಸಂಖ್ಯೆ, ವಿಳಾಸ.",
  mr: "उत्तर मराठीत आहे. नाव, जन्मतारीख, मोबाईल नंबर, आधार क्रमांक, पत्ता.",
  ta: "பதில் தமிழில் உள்ளது. பெயர், பிறந்த தேதி, அலைபேசி எண், ஆதார் எண், முகவரி.",
  te: "సమాధానం తెలుగులో ఉంది. పేరు, పుట్టిన తేదీ, మొబైల్ నంబర్, ఆధార్ నంబర్, చిరునామా.",
  bn: "উত্তর বাংলায় আছে। নাম, জন্মতারিখ, মোবাইল নম্বর, আধার নম্বর, ঠিকানা।",
  gu: "જવાબ ગુજરાતીમાં છે. નામ, જન્મતારીખ, મોબાઇલ નંબર, આધાર નંબર, સરનામું.",
};

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const limit = checkRateLimit(`transcribe:${ip}`, 60, 60 * 1000);
    if (!limit.ok) {
      return Response.json({ error: "Too many voice requests. Please wait a minute." }, { status: 429 });
    }

    const fd = await req.formData();
    const audio = fd.get("audio");
    const lang = String(fd.get("lang") ?? "en");
    if (!(audio instanceof Blob) || audio.size === 0) {
      return Response.json({ error: "No audio received." }, { status: 400 });
    }
    if (audio.size > MAX_BYTES) {
      return Response.json({ error: "Recording is too long. Please keep answers short." }, { status: 413 });
    }
    const name = audio instanceof File && audio.name ? audio.name : "answer.webm";
    // Hinglish: let Whisper auto-detect, steered by prompt
    const language =
      lang === "hinglish"
        ? undefined
        : ["hi", "kn", "en", "mr", "ta", "te", "bn", "gu"].includes(lang)
          ? lang
          : undefined;
    const text = await transcribe(audio, name, language, HINTS[lang]);
    return Response.json({ text });
  } catch (err) {
    return errorResponse(err);
  }
}
