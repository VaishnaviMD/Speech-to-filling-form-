// Robust multilingual matching for affirmative and negative confirmations
const AFFIRMATIVE_WORDS = [
  // English
  "yes", "yeah", "yep", "correct", "confirm", "confirmed", "right", "sure", "ok", "okay", "fine", "perfect", "good", "accept",
  // Hindi & Hinglish
  "हाँ", "हा", "सही", "सही है", "पुष्टि", "ठीक", "ठीक है", "अच्छा", "कर दो", "भर दो",
  "haan", "ha", "haa", "sahi", "sahi hai", "theek", "theek hai", "accha", "achha", "kar do", "bhar do",
  // Kannada
  "ಹೌದು", "ಸರಿ", "ಸರಿಯಾಗಿದೆ", "ಖಚಿತ", "ಖಚಿತಪಡಿಸಿ", "ಆಗಲಿ", "ಒಪ್ಪಿಗೆ", "ಹಾದು",
  "houdu", "haudu", "sari", "sariyagide", "aagali"
];

const NEGATIVE_WORDS = [
  // English
  "no", "nope", "wrong", "incorrect", "change", "edit", "cancel", "mistake", "modify", "not right", "again",
  // Hindi & Hinglish
  "नहीं", "ना", "गलत", "गलत है", "बदलो", "बदलें", "फिर से", "रद्द",
  "nahi", "nahin", "na", "galat", "galat hai", "badlo", "badal do", "change karo", "phir se", "cancel",
  // Kannada
  "ಇಲ್ಲ", "ತಪ್ಪು", "ಬದಲಾಯಿಸಿ", "ಬೇಡ", "ಮತ್ತೊಮ್ಮೆ", "ಸರಿಯಿಲ್ಲ",
  "illa", "thappu", "tappu", "badalaisi", "beda", "sariyilla"
];

export function isAffirmative(text: string): boolean {
  const clean = text.trim().toLowerCase().replace(/[.,!?;:'"()]/g, "");
  if (!clean) return false;

  // Exact or word boundary match
  return AFFIRMATIVE_WORDS.some((word) => {
    const w = word.toLowerCase();
    return clean === w || clean.startsWith(`${w} `) || clean.endsWith(` ${w}`) || clean.includes(` ${w} `);
  });
}

export function isNegative(text: string): boolean {
  const clean = text.trim().toLowerCase().replace(/[.,!?;:'"()]/g, "");
  if (!clean) return false;

  // Exact or word boundary match
  return NEGATIVE_WORDS.some((word) => {
    const w = word.toLowerCase();
    return clean === w || clean.startsWith(`${w} `) || clean.endsWith(` ${w}`) || clean.includes(` ${w} `);
  });
}
