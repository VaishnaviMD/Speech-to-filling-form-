import type { FieldType } from "./types";

// NATO & Phonetic alphabet mappings
const PHONETIC_MAP: Record<string, string> = {
  alpha: "A", bravo: "B", charlie: "C", delta: "D", echo: "E", foxtrot: "F", golf: "G",
  hotel: "H", india: "I", juliet: "J", kilo: "K", lima: "L", mike: "M", november: "N",
  oscar: "O", papa: "P", quebec: "Q", romeo: "R", sierra: "S", tango: "T", uniform: "U",
  victor: "V", whiskey: "W", xray: "X", yankee: "Y", zulu: "Z",
  // Common vernacular letter mnemonics
  apple: "A", boy: "B", cat: "C", dog: "D", elephant: "E", fish: "F",
  goat: "G", hen: "H", ice: "I", jug: "J", kite: "K", lion: "L", monkey: "M",
  nest: "N", orange: "O", parrot: "P", queen: "Q", rose: "R", sun: "S", tiger: "T",
  umbrella: "U", van: "V", watch: "W", xerox: "X", yellow: "Y", zebra: "Z"
};

// Multilingual word to digit map
const DIGIT_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  // Hindi
  शून्य: "0", एक: "1", दो: "2", तीन: "3", चार: "4", पाँच: "5", पांच: "5", छह: "6", सात: "7", आठ: "8", नौ: "9",
  // Kannada
  ಸೊನ್ನೆ: "0", ಒಂದು: "1", ಎರಡು: "2", ಮೂರು: "3", ನಾಲ್ಕು: "4", ಐದು: "5", ಆರು: "6", ಏಳು: "7", ಎಂಟು: "8", ಒಂಬತ್ತು: "9",
  // Hinglish
  shunya: "0", ek: "1", do: "2", teen: "3", chaar: "4", paanch: "5", chhah: "6", saat: "7", aath: "8", nau: "9",
  sonne: "0", ondu: "1", eradu: "2", mooru: "3", naalku: "4", aidu: "5", aaru: "6", eylu: "7", entu: "8", ombattu: "9"
};

/**
 * Deterministically parses spoken email addresses into clean RFC-compliant formats.
 * e.g., "vaishnavi 1 2 3 at gmail dot com" -> "vaishnavi123@gmail.com"
 */
export function parseSpokenEmail(raw: string): string {
  let text = raw.toLowerCase().trim();

  // Replace common email spoken tokens
  text = text
    .replace(/\s*(at the rate|at rate|at)\s*/gi, "@")
    .replace(/\s*(dot|point|period)\s*/gi, ".")
    .replace(/\s*(underscore)\s*/gi, "_")
    .replace(/\s*(dash|hyphen|minus)\s*/gi, "-");

  // Replace spoken digit words inside emails
  for (const [word, digit] of Object.entries(DIGIT_WORDS)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    text = text.replace(regex, digit);
  }

  // Remove unwanted spaces
  text = text.replace(/\s+/g, "");
  return text;
}

/**
 * Deterministically parses spelled-out characters, letters, and phonetic words.
 * e.g., "V for Victor A I S H N A V I" -> "VAISHNAVI"
 */
export function parseSpokenCharacters(raw: string): string {
  let text = raw.trim();

  // Strip "for <word>" patterns (e.g. "v for victor" -> "v victor")
  text = text.replace(/\b(for|as in|se|indha)\b/gi, " ");

  const tokens = text.split(/[\s,.-]+/);
  const out: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (PHONETIC_MAP[lower]) {
      out.push(PHONETIC_MAP[lower]);
    } else if (DIGIT_WORDS[lower]) {
      out.push(DIGIT_WORDS[lower]);
    } else if (/^[a-zA-Z0-9]$/.test(token)) {
      out.push(token.toUpperCase());
    } else if (/^[a-zA-Z0-9]+$/.test(token) && token.length <= 4) {
      // Short clusters like "AB" or digits
      out.push(token.toUpperCase());
    } else if (token.length > 0) {
      // Just take the characters directly
      out.push(token.toUpperCase());
    }
  }

  return out.join("");
}

/**
 * Parses spoken numbers in English, Hindi, or Kannada into pure digits.
 */
export function parseSpokenDigits(raw: string): string {
  let text = raw.toLowerCase().trim();

  for (const [word, digit] of Object.entries(DIGIT_WORDS)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    text = text.replace(regex, digit);
  }

  return text.replace(/\D/g, "");
}

/**
 * Formats long numbers into readable, standard human chunks for display.
 * e.g., Aadhaar -> "1234 5678 9012", Phone -> "98765 43210"
 */
export function formatNumberChunks(value: string, type: FieldType): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;

  switch (type) {
    case "aadhaar":
      // 4-4-4 grouping
      return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
    case "phone":
      // 5-5 grouping
      if (digits.length === 10) {
        return `${digits.slice(0, 5)} ${digits.slice(5)}`;
      }
      return digits;
    case "pincode":
      // 3-3 grouping
      if (digits.length === 6) {
        return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      }
      return digits;
    case "ifsc": {
      // 4 letters, 0, 6 characters
      const clean = value.toUpperCase().replace(/\s+/g, "");
      if (clean.length === 11) {
        return `${clean.slice(0, 4)} 0 ${clean.slice(5)}`;
      }
      return clean;
    }
    default:
      return value;
  }
}

/**
 * Formats a string with spaced pause commas so TTS reads each character distinctly.
 * e.g., "VAISHNAVI" -> "V, A, I, S, H, N, A, V, I"
 */
export function characterReadout(text: string): string {
  return text.split("").join(", ");
}

/**
 * Formats digits with spaced pause commas so TTS reads individual digits slowly.
 * e.g., "98765" -> "9, 8, 7, 6, 5"
 */
export function digitReadout(digits: string): string {
  return digits.replace(/\D/g, "").split("").join(", ");
}

/**
 * Recognizes voice commands specifically related to spelling or character correction.
 */
export function parseSpellingVoiceCommand(raw: string): "spell" | "backspace" | "clear" | "read" | "done" | null {
  const clean = raw.trim().toLowerCase();

  // Spell mode triggers
  if (/^(spell|spell it|spelling|spelling mode|अक्षर बोलें|ಅಕ್ಷರಶಃ)/i.test(clean)) {
    return "spell";
  }

  // Backspace / Delete last character
  if (/(delete last|backspace|remove last|हटाओ|अक्षर हटाओ|ಅಳಿಸಿ|ಹಿಂದಕ್ಕೆ)/i.test(clean)) {
    return "backspace";
  }

  // Clear / Start again
  if (/^(clear|clear all|start again|मिटाओ|ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಿ|ಖಾಲಿ ಮಾಡಿ)/i.test(clean)) {
    return "clear";
  }

  // Read out
  if (/(read character|read letter|read digits|ಅಕ್ಷರ ಓದಿ|अक्षर पढ़कर सुनाओ|पढ़ो)/i.test(clean)) {
    return "read";
  }

  // Done / Apply
  if (/^(done|finish|apply|ho gaya|ಮುಗಿಯಿತು|ಸರಿ)/i.test(clean)) {
    return "done";
  }

  return null;
}
