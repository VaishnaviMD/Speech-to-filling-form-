export type VoiceCommandIntent =
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "REPEAT_QUESTION" }
  | { type: "REPEAT_ANSWER" }
  | { type: "CORRECT" }
  | { type: "SPELL" }
  | { type: "SKIP" }
  | { type: "READ_ALL" }
  | { type: "REVIEW" }
  | { type: "SUBMIT" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | null;

/**
 * Recognizes general navigation voice commands across English, Hindi, Hinglish, and Kannada.
 */
export function parseVoiceNavigationCommand(raw: string): VoiceCommandIntent {
  const clean = raw.trim().toLowerCase().replace(/[.,!?;:'"()]/g, "");
  if (!clean) return null;

  // NEXT
  if (
    /^(next|next question|next field|go next|forward)$/i.test(clean) ||
    /^(अगला|आगे|अगला सवाल|आगे बढ़ें|अगला प्रश्न)$/i.test(clean) ||
    /^(agla|aage|agla sawal|aage badho)$/i.test(clean) ||
    /^(ಮುಂದೆ|ಮುಂದಿನ|ಮುಂದಿನ ಪ್ರಶ್ನೆ|ಮುಂದಕ್ಕೆ)$/i.test(clean)
  ) {
    return { type: "NEXT" };
  }

  // PREVIOUS / BACK
  if (
    /^(previous|previous question|go back|back|back question)$/i.test(clean) ||
    /^(पिछला|पीछे|पिछला सवाल|पीछे जाओ|पिछला प्रश्न)$/i.test(clean) ||
    /^(pichhla|peeche|pichhla sawal|peeche jao)$/i.test(clean) ||
    /^(ಹಿಂದೆ|ಹಿಂದಿನ|ಹಿಂದಿನ ಪ್ರಶ್ನೆ|ಹಿಂದಕ್ಕೆ)$/i.test(clean)
  ) {
    return { type: "PREVIOUS" };
  }

  // REPEAT QUESTION
  if (
    /^(repeat|repeat question|say again|ask again)$/i.test(clean) ||
    /^(फिर से|फिर से बोलो|दोहराओ|सवाल दोहराओ)$/i.test(clean) ||
    /^(phir se|phir se bolo|dobara bolo)$/i.test(clean) ||
    /^(ಮತ್ತೊಮ್ಮೆ|ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ|ಮತ್ತೆ ಕೇಳಿ|ಪ್ರಶ್ನೆ ಪುನರಾವರ್ತಿಸಿ)$/i.test(clean)
  ) {
    return { type: "REPEAT_QUESTION" };
  }

  // REPEAT HEARD ANSWER
  if (
    /^(repeat answer|what did you hear|read answer)$/i.test(clean) ||
    /^(क्या सुना|जवाब दोहराओ|क्या लिखा)$/i.test(clean) ||
    /^(kya suna|jawab phir se bolo)$/i.test(clean) ||
    /^(ಏನು ಕೇಳಿಸಿಕೊಂಡಿರಿ|ಉತ್ತರ ಮತ್ತೆ ಹೇಳಿ)$/i.test(clean)
  ) {
    return { type: "REPEAT_ANSWER" };
  }

  // CORRECT / CHANGE
  if (
    /^(correct|correct it|correct answer|change answer|edit answer)$/i.test(clean) ||
    /^(बदलो|बदलें|जवाब बदलो|गलत है)$/i.test(clean) ||
    /^(badlo|change karo|galat hai|theek karo)$/i.test(clean) ||
    /^(ಬದಲಾಯಿಸಿ|ತಪ್ಪು|ಸರಿಪಡಿಸಿ|ತಪ್ಪಾಗಿದೆ)$/i.test(clean)
  ) {
    return { type: "CORRECT" };
  }

  // SPELL IT
  if (
    /^(spell|spell it|spell my name|spelling mode|start spelling)$/i.test(clean) ||
    /^(अक्षर बोलें|स्पेलिंग|अक्षर-दर-अक्षर)$/i.test(clean) ||
    /^(spell karo|akshar bolo|spelling)$/i.test(clean) ||
    /^(ಅಕ್ಷರಶಃ|ಅಕ್ಷರಶಃ ಹೇಳಿ|ಸ್ಪೆಲ್ಲಿಂಗ್)$/i.test(clean)
  ) {
    return { type: "SPELL" };
  }

  // SKIP
  if (
    /^(skip|skip question|skip it|leave it|pass)$/i.test(clean) ||
    /^(छोड़ें|छोड़ दो|छोड़िए|आगे निकलो)$/i.test(clean) ||
    /^(skip karo|chhod do|chhor do)$/i.test(clean) ||
    /^(ಬಿಟ್ಟುಬಿಡಿ|ಮುಂದಕ್ಕೆ ಹೋಗಿ|ಬೇಡ)$/i.test(clean)
  ) {
    return { type: "SKIP" };
  }

  // READ ALL ANSWERS
  if (
    /^(read my answers|read all answers|read answers|read back)$/i.test(clean) ||
    /^(सारे जवाब पढ़ो|जवाब पढ़कर सुनाओ|सब पढ़ो)$/i.test(clean) ||
    /^(sab padho|saare answers padho)$/i.test(clean) ||
    /^(ಎಲ್ಲ ಉತ್ತರಗಳನ್ನು ಓದಿ|ಉತ್ತರಗಳನ್ನು ಕೇಳಿ)$/i.test(clean)
  ) {
    return { type: "READ_ALL" };
  }

  // REVIEW FORM
  if (
    /^(review|review form|check form|show summary)$/i.test(clean) ||
    /^(फॉर्म जांचें|जांच करो|समीक्षा करें)$/i.test(clean) ||
    /^(form check karo|review karo)$/i.test(clean) ||
    /^(ಫಾರ್ಮ್ ಪರಿಶೀಲಿಸಿ|ಪರಿಶೀಲನೆ)$/i.test(clean)
  ) {
    return { type: "REVIEW" };
  }

  // SUBMIT / DOWNLOAD
  if (
    /^(submit|submit form|finalize|download pdf|download form)$/i.test(clean) ||
    /^(जमा करें|फॉर्म जमा करो|डाउनलोड करें)$/i.test(clean) ||
    /^(submit karo|jama karo|download karo)$/i.test(clean) ||
    /^(ಸಲ್ಲಿಸಿ|ಫಾರ್ಮ್ ಸಲ್ಲಿಸಿ|ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ)$/i.test(clean)
  ) {
    return { type: "SUBMIT" };
  }

  // PAUSE HANDS-FREE
  if (
    /^(pause|pause listening|stop listening|hands free off|wait|hold on)$/i.test(clean) ||
    /^(रुकिए|रोको|रुक जाओ|थोड़ा रुको|ठहरो)$/i.test(clean) ||
    /^(pause karo|ruko|thoda ruko|stop karo)$/i.test(clean) ||
    /^(ನಿಲ್ಲಿಸಿ|ವಿರಾಮ|ಸ್ವಲ್ಪ ನಿಲ್ಲಿ|ತಡೆಯಿರಿ)$/i.test(clean)
  ) {
    return { type: "PAUSE" };
  }

  // RESUME HANDS-FREE
  if (
    /^(resume|start listening|continue|hands free on|go ahead)$/i.test(clean) ||
    /^(जारी रखें|शुरू करो|चालू करो|आगे बढ़ो)$/i.test(clean) ||
    /^(resume karo|shuru karo|continue karo|chalu karo)$/i.test(clean) ||
    /^(ಮುಂದುವರಿಸಿ|ಪ್ರಾರಂಭಿಸಿ|ಮುಂದುವರೆಯಿರಿ)$/i.test(clean)
  ) {
    return { type: "RESUME" };
  }

  return null;
}
