// Pre-extracted fields + questions for the bundled sample forms, so the demo
// starts instantly and still works if the extraction call is slow or down.
import type { Field, Lang } from "./types";

type Q = Partial<Record<Lang, string>>;
type SampleField = Omit<Field, "placement" | "ref"> & { q: Q; acroKind?: "text" | "checkbox" };

export type Sample = {
  key: string;
  title: string;
  titleHi: string;
  titleKn: string;
  url: string;
  fields: SampleField[];
};

const bank = (n: string): SampleField[] => [
  {
    id: "bank_account",
    label: `${n}. Bank account number`,
    type: "account",
    format: "digits",
    required: true,
    options: null,
    q: {
      en: "What is your bank account number? It is on the first page of your passbook.",
      hi: "आपका बैंक खाता नंबर क्या है? यह पासबुक के पहले पन्ने पर लिखा होता है।",
      hinglish: "Aapka bank account number kya hai? Passbook ke pehle page par likha hota hai.",
      kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಂಖ್ಯೆ ಏನು? ಇದು ಪಾಸ್‌ಬುಕ್‌ನ ಮೊದಲ ಪುಟದಲ್ಲಿ ಬರೆಯಲಾಗಿರುತ್ತದೆ.",
    },
  },
  {
    id: "ifsc",
    label: `${+n + 1}. IFSC code`,
    type: "ifsc",
    format: "11 characters",
    required: true,
    options: null,
    q: {
      en: "What is your bank's IFSC code? It's the short code printed on your passbook.",
      hi: "आपके बैंक का IFSC कोड क्या है? यह पासबुक पर छपा छोटा कोड है।",
      hinglish: "Aapke bank ka IFSC code kya hai? Passbook par chhota code likha hota hai.",
      kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕಿನ IFSC ಕೋಡ್ ಏನು? ಇದು ಪಾಸ್‌ಬುಕ್‌ನಲ್ಲಿ ಮುದ್ರಿಸಲಾದ ಕಿರು ಕೋಡ್.",
    },
  },
];

const mobile = (n: string): SampleField => ({
  id: "mobile",
  label: `${n}. Mobile number`,
  type: "phone",
  format: "10 digits",
  required: true,
  options: null,
  q: {
    en: "What is your mobile number?",
    hi: "आपका मोबाइल नंबर क्या है?",
    hinglish: "Aapka mobile number kya hai?",
    kn: "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಏನು?",
  },
});

const declaration: SampleField = {
  id: "declaration",
  label: "Declaration that the information is true",
  type: "yesno",
  format: null,
  required: true,
  options: null,
  acroKind: "checkbox",
  q: {
    en: "Do you confirm that everything you told me is true? Say yes or no.",
    hi: "क्या आप पुष्टि करते हैं कि आपने जो बताया वह सब सच है? हाँ या ना बोलिए।",
    hinglish: "Kya aap confirm karte hain ki sab jaankari sach hai? Haan ya na boliye.",
    kn: "ನೀವು ನೀಡಿದ ಮಾಹಿತಿ ಎಲ್ಲವೂ ಸತ್ಯವೆಂದು ದೃಢೀಕರಿಸುತ್ತೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
  },
};

export const SAMPLES: Sample[] = [
  {
    key: "pension",
    title: "Old Age Pension Form",
    titleHi: "वृद्धावस्था पेंशन फ़ॉर्म",
    titleKn: "ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿ ಅರ್ಜಿ",
    url: "/samples/pension-form.pdf",
    fields: [
      {
        id: "applicant_name",
        label: "1. Full name of applicant",
        type: "name",
        format: null,
        required: true,
        options: null,
        q: {
          en: "What is your full name?",
          hi: "आपका पूरा नाम क्या है?",
          hinglish: "Aapka poora naam kya hai?",
          kn: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?",
        },
      },
      {
        id: "father_husband_name",
        label: "2. Father's / Husband's name",
        type: "name",
        format: null,
        required: true,
        options: null,
        q: {
          en: "What is your father's or husband's name?",
          hi: "आपके पिता या पति का नाम क्या है?",
          hinglish: "Aapke pitaji ya pati ka naam kya hai?",
          kn: "ನಿಮ್ಮ ತಂದೆ ಅಥವಾ ಪತಿಯ ಹೆಸರು ಏನು?",
        },
      },
      {
        id: "dob",
        label: "3. Date of birth",
        type: "date",
        format: "DD/MM/YYYY",
        required: true,
        options: null,
        q: {
          en: "When were you born? Tell me the day, month and year.",
          hi: "आपका जन्म कब हुआ था? दिन, महीना और साल बताइए।",
          hinglish: "Aapka janam kab hua tha? Din, mahina aur saal bataiye.",
          kn: "ನಿಮ್ಮ ಜನ್ಮ ದಿನಾಂಕ ಯಾವುದು? ದಿನ, ತಿಂಗಳು ಮತ್ತು ವರ್ಷವನ್ನು ಹೇಳಿ.",
        },
      },
      {
        id: "gender",
        label: "4. Gender",
        type: "choice",
        format: null,
        required: true,
        options: ["Male", "Female", "Other"],
        q: {
          en: "Are you male, female, or other?",
          hi: "आप पुरुष हैं, महिला हैं, या अन्य?",
          hinglish: "Aap purush hain, mahila hain, ya other?",
          kn: "ನೀವು ಪುರುಷ, ಮಹಿಳೆ ಅಥವಾ ಇತರರೇ?",
        },
      },
      {
        id: "aadhaar",
        label: "5. Aadhaar number",
        type: "aadhaar",
        format: "12 digits",
        required: true,
        options: null,
        q: {
          en: "Please read the 12-digit number on your Aadhaar card.",
          hi: "कृपया अपने आधार कार्ड पर लिखा 12 अंकों का नंबर बताइए।",
          hinglish: "Apne Aadhaar card ka 12 digit number bataiye.",
          kn: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆಧಾರ್ ಕಾರ್ಡ್‌ನಲ್ಲಿರುವ 12 ಅಂಕಿಗಳ ಸಂಖ್ಯೆಯನ್ನು ಹೇಳಿ.",
        },
      },
      mobile("6"),
      {
        id: "address",
        label: "7. Permanent address",
        type: "address",
        format: null,
        required: true,
        options: null,
        q: {
          en: "Where do you live? Tell me your house, village or area, and city.",
          hi: "आप कहाँ रहते हैं? मकान, गाँव या मोहल्ला, और शहर बताइए।",
          hinglish: "Aap kahan rehte hain? Ghar, gaon ya mohalla, aur sheher bataiye.",
          kn: "ನೀವು ಎಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದೀರಿ? ಮನೆ, ಗ್ರಾಮ ಅಥವಾ ಬಡಾವಣೆ ಮತ್ತು ನಗರವನ್ನು ಹೇಳಿ.",
        },
      },
      {
        id: "pincode",
        label: "8. PIN code",
        type: "pincode",
        format: "6 digits",
        required: true,
        options: null,
        q: {
          en: "What is the 6-digit PIN code of your area?",
          hi: "आपके इलाके का 6 अंकों का पिन कोड क्या है?",
          hinglish: "Aapke area ka 6 digit PIN code kya hai?",
          kn: "ನಿಮ್ಮ ಪ್ರದೇಶದ 6 ಅಂಕಿಗಳ ಪಿನ್ ಕೋಡ್ ಏನು?",
        },
      },
      ...bank("9"),
      declaration,
    ],
  },
  {
    key: "scholarship",
    title: "Post-Matric Scholarship Form",
    titleHi: "छात्रवृत्ति फ़ॉर्म",
    titleKn: "ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿ",
    url: "/samples/scholarship-form.pdf",
    fields: [
      {
        id: "student_name",
        label: "1. Name of student",
        type: "name",
        format: null,
        required: true,
        options: null,
        q: {
          en: "What is the student's full name?",
          hi: "छात्र का पूरा नाम क्या है?",
          hinglish: "Student ka poora naam kya hai?",
          kn: "ವಿದ್ಯಾರ್ಥಿಯ ಪೂರ್ಣ ಹೆಸರು ಏನು?",
        },
      },
      {
        id: "dob",
        label: "2. Date of birth",
        type: "date",
        format: "DD/MM/YYYY",
        required: true,
        options: null,
        q: {
          en: "What is the student's date of birth? Day, month and year.",
          hi: "छात्र की जन्म तिथि क्या है? दिन, महीना और साल।",
          hinglish: "Student ki date of birth kya hai? Din, mahina aur saal.",
          kn: "ವಿದ್ಯಾರ್ಥಿಯ ಜನ್ಮ ದಿನಾಂಕ ಯಾವುದು? ದಿನ, ತಿಂಗಳು ಮತ್ತು ವರ್ಷವನ್ನು ಹೇಳಿ.",
        },
      },
      {
        id: "institution",
        label: "3. Name of school / college",
        type: "text",
        format: null,
        required: true,
        options: null,
        q: {
          en: "Which school or college does the student study in?",
          hi: "छात्र किस स्कूल या कॉलेज में पढ़ता है?",
          hinglish: "Student kis school ya college mein padhta hai?",
          kn: "ವಿದ್ಯಾರ್ಥಿಯು ಯಾವ ಶಾಲೆ ಅಥವಾ ಕಾಲೇಜಿನಲ್ಲಿ ಓದುತ್ತಿದ್ದಾನೆ?",
        },
      },
      {
        id: "course",
        label: "4. Course and year of study",
        type: "text",
        format: null,
        required: true,
        options: null,
        q: {
          en: "Which class or course, and which year?",
          hi: "कौन सी कक्षा या कोर्स, और कौन सा साल?",
          hinglish: "Kaunsi class ya course, aur kaunsa saal?",
          kn: "ಯಾವ ತರಗತಿ ಅಥವಾ ಕೋರ್ಸ್ ಮತ್ತು ಯಾವ ವರ್ಷ?",
        },
      },
      {
        id: "category",
        label: "5. Category",
        type: "choice",
        format: null,
        required: true,
        options: ["General", "OBC", "SC", "ST", "EWS"],
        q: {
          en: "Which category: General, OBC, SC, ST, or EWS?",
          hi: "आपकी श्रेणी क्या है: जनरल, ओबीसी, एससी, एसटी या ईडब्ल्यूएस?",
          hinglish: "Aapki category kya hai: General, OBC, SC, ST ya EWS?",
          kn: "ನಿಮ್ಮ ವರ್ಗ ಯಾವುದು: ಸಾಮಾನ್ಯ, ಒಬಿಸಿ, ಎಸ್‌ಸಿ, ಎಸ್‌ಟಿ ಅಥವಾ ಇಡಬ್ಲ್ಯೂಎಸ್?",
        },
      },
      {
        id: "family_income",
        label: "6. Annual family income (Rs.)",
        type: "number",
        format: "rupees per year",
        required: true,
        options: null,
        q: {
          en: "How much does the whole family earn in one year, in rupees?",
          hi: "पूरे परिवार की एक साल की कमाई कितने रुपये है?",
          hinglish: "Poore parivaar ki saal bhar ki kamai kitne rupaye hai?",
          kn: "ಇಡೀ ಕುಟುಂಬದ ಒಂದು ವರ್ಷದ ಆದಾಯ ಎಷ್ಟು ರೂಪಾಯಿ?",
        },
      },
      mobile("7"),
      {
        id: "email",
        label: "8. Email ID",
        type: "email",
        format: null,
        required: false,
        options: null,
        q: {
          en: "Do you have an email address? You can say skip if not.",
          hi: "क्या आपका कोई ईमेल है? नहीं है तो 'छोड़ दो' बोलिए।",
          hinglish: "Kya aapka email hai? Nahi hai toh 'skip' boliye.",
          kn: "ನಿಮ್ಮ ಬಳಿ ಇಮೇಲ್ ವಿಳಾಸವಿದೆಯೇ? ಇಲ್ಲದಿದ್ದರೆ 'ಬಿಟ್ಟುಬಿಡಿ' ಎಂದು ಹೇಳಬಹುದು.",
        },
      },
      ...bank("9"),
      declaration,
    ],
  },
];

export function sampleFields(s: Sample): { fields: Field[]; questions: Partial<Record<Lang, Record<string, string>>> } {
  const questions: Partial<Record<Lang, Record<string, string>>> = { en: {}, hi: {}, hinglish: {}, kn: {} };
  const fields = s.fields.map(({ q, acroKind, ...f }) => {
    for (const l of Object.keys(q) as Lang[]) {
      if (!questions[l]) questions[l] = {};
      if (q[l]) questions[l]![f.id] = q[l]!;
    }
    return { ...f, ref: f.id, placement: { kind: "acro" as const, name: f.id, acroKind: acroKind ?? "text" } };
  });
  return { fields, questions };
}
