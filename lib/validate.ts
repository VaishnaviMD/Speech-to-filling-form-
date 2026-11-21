import type { FieldBrief, Lang } from "./types";

type ErrKey = "date" | "phone" | "pincode" | "aadhaar" | "ifsc" | "email" | "number" | "account" | "choice" | "empty";

const MSG: Record<ErrKey, Partial<Record<Lang, string>>> = {
  date: {
    en: "That date doesn't look right. Please say the day, month and year.",
    hi: "यह तारीख सही नहीं लग रही। कृपया दिन, महीना और साल बताइए।",
    hinglish: "Yeh date sahi nahi lag rahi. Din, mahina aur saal bataiye.",
    kn: "ಆ ದಿನಾಂಕ ಸರಿಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ದಿನ, ತಿಂಗಳು ಮತ್ತು ವರ್ಷವನ್ನು ಹೇಳಿ.",
  },
  phone: {
    en: "A mobile number has 10 digits. Please say it again slowly.",
    hi: "मोबाइल नंबर 10 अंकों का होता है। कृपया धीरे-धीरे फिर से बोलिए।",
    hinglish: "Mobile number 10 digit ka hota hai. Dheere-dheere phir se boliye.",
    kn: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ 10 ಅಂಕಿಗಳಾಗಿರಬೇಕು. ದಯವಿಟ್ಟು ನಿಧಾನವಾಗಿ ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ.",
  },
  pincode: {
    en: "A PIN code has 6 digits. Please say it again.",
    hi: "पिन कोड 6 अंकों का होता है। कृपया फिर से बताइए।",
    hinglish: "PIN code 6 digit ka hota hai. Phir se bataiye.",
    kn: "ಪಿನ್ ಕೋಡ್ 6 ಅಂಕಿಗಳಾಗಿರಬೇಕು. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ.",
  },
  aadhaar: {
    en: "An Aadhaar number has 12 digits. Please read it from your card.",
    hi: "आधार नंबर 12 अंकों का होता है। कृपया अपने कार्ड से पढ़कर बताइए।",
    hinglish: "Aadhaar number 12 digit ka hota hai. Card se padhkar bataiye.",
    kn: "ಆಧಾರ್ ಸಂಖ್ಯೆ 12 ಅಂಕಿಗಳಾಗಿರಬೇಕು. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಕಾರ್ಡ್ ನೋಡಿ ಹೇಳಿ.",
  },
  ifsc: {
    en: "The IFSC code has 11 letters and numbers. It is printed in your passbook.",
    hi: "IFSC कोड में 11 अक्षर और अंक होते हैं। यह आपकी पासबुक में छपा होता है।",
    hinglish: "IFSC code mein 11 letters aur numbers hote hain. Passbook mein likha hota hai.",
    kn: "IFSC ಕೋಡ್ 11 ಅಕ್ಷರ ಮತ್ತು ಅಂಕಿಗಳನ್ನು ಒಳಗೊಂಡಿರುತ್ತದೆ. ಇದು ನಿಮ್ಮ ಪಾಸ್‌ಬುಕ್‌ನಲ್ಲಿದೆ.",
  },
  email: {
    en: "That email doesn't look right. Please say it again.",
    hi: "यह ईमेल सही नहीं लग रहा। कृपया फिर से बताइए।",
    hinglish: "Yeh email sahi nahi lag raha. Phir se bataiye.",
    kn: "ಆ ಇಮೇಲ್ ಸರಿಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ.",
  },
  number: {
    en: "Please say just the number.",
    hi: "कृपया सिर्फ़ नंबर बताइए।",
    hinglish: "Sirf number bataiye.",
    kn: "ದಯವಿಟ್ಟು ಕೇವಲ ಸಂಖ್ಯೆಯನ್ನು ಹೇಳಿ.",
  },
  account: {
    en: "An account number has 9 to 18 digits. Please read it from your passbook.",
    hi: "खाता नंबर 9 से 18 अंकों का होता है। कृपया पासबुक से पढ़कर बताइए।",
    hinglish: "Account number 9 se 18 digit ka hota hai. Passbook se padhkar bataiye.",
    kn: "ಖಾತೆ ಸಂಖ್ಯೆ 9 ರಿಂದ 18 ಅಂಕಿಗಳಾಗಿರಬೇಕು. ದಯವಿಟ್ಟು ಪಾಸ್‌ಬುಕ್ ನೋಡಿ ಹೇಳಿ.",
  },
  choice: {
    en: "Please choose one of the options.",
    hi: "कृपया दिए गए विकल्पों में से एक चुनिए।",
    hinglish: "Diye gaye options mein se ek chuniye.",
    kn: "ದಯವಿಟ್ಟು ನೀಡಲಾದ ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆರಿಸಿ.",
  },
  empty: {
    en: "I didn't catch that. Please answer again.",
    hi: "मैं समझ नहीं पाई। कृपया फिर से बताइए।",
    hinglish: "Main samajh nahi paayi. Phir se bataiye.",
    kn: "ನನಗೆ ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಉತ್ತರಿಸಿ.",
  },
};

function validDate(v: string) {
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const [d, mo, y] = [+m[1], +m[2], +m[3]];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d && y > 1900 && y < 2100;
}

/** Returns a spoken-friendly error in the user's language, or null if the value is fine. */
export function validate(field: FieldBrief, value: string, lang: Lang): string | null {
  const v = value.trim();
  const fail = (k: ErrKey) => MSG[k][lang] ?? MSG[k].hi ?? MSG[k].en ?? "";
  if (!v) return fail("empty");
  const digits = v.replace(/\D/g, "");
  switch (field.type) {
    case "date":
      return field.format && !/DD\/MM\/YYYY/i.test(field.format) ? null : validDate(v) ? null : fail("date");
    case "phone":
      return /^[6-9]\d{9}$/.test(digits.slice(-10)) && digits.length >= 10 ? null : fail("phone");
    case "pincode":
      return /^[1-9]\d{5}$/.test(v) ? null : fail("pincode");
    case "aadhaar":
      return /^\d{12}$/.test(digits) ? null : fail("aadhaar");
    case "ifsc":
      return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.toUpperCase()) ? null : fail("ifsc");
    case "account":
      return /^\d{9,18}$/.test(digits) ? null : fail("account");
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : fail("email");
    case "number":
      return /^-?\d+(\.\d+)?$/.test(v.replace(/,/g, "")) ? null : fail("number");
    case "choice":
      return !field.options?.length || field.options.some((o) => o.toLowerCase() === v.toLowerCase()) ? null : fail("choice");
    default:
      return null;
  }
}

/** Offline best-effort cleanup used when the AI service is unreachable, so the demo keeps going. */
export function localNormalize(field: FieldBrief, answer: string): string {
  const a = answer.trim();
  const digits = a.replace(/\D/g, "");
  switch (field.type) {
    case "phone":
      return digits.slice(-10);
    case "name": {
      let cleaned = a
        .replace(/^(my\s+name\s+is|i\s+am|myself|this\s+is|name\s+is)\s+/i, "")
        .replace(/^(mera\s+naam\s+|naam\s+|humara\s+naam\s+)/i, "")
        .replace(/^(nanna\s+hesaru\s+|hesaru\s+)/i, "")
        .replace(/\s+(hai|h|ide|aagide)$/i, "")
        .trim();
      return cleaned
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
    case "pincode":
    case "aadhaar":
    case "account":
    case "number":
      return digits;
    case "ifsc":
      return a.replace(/\s/g, "").toUpperCase();
    case "date": {
      const m = a.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})/);
      return m ? `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}` : a;
    }
    case "yesno":
      return /^(y|yes|haan|han|ha|हाँ|हां)/i.test(a) ? "Yes" : "No";
    case "choice":
      return field.options?.find((o) => a.toLowerCase().includes(o.toLowerCase())) ?? a;
    default:
      return a;
  }
}
