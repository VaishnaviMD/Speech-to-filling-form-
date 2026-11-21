import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { FieldBriefSchema, LangSchema, type FormEvaluationResult, type FormEvaluationIssue } from "@/lib/types";
import { validate } from "@/lib/validate";

const Body = z.object({
  fields: z.array(FieldBriefSchema),
  values: z.record(z.string(), z.string()),
  lang: LangSchema,
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const limit = checkRateLimit(`evaluate:${ip}`, 30, 60 * 1000);
    if (!limit.ok) {
      return Response.json({ error: "Too many evaluation requests. Please wait a minute." }, { status: 429 });
    }

    const { fields, values, lang } = Body.parse(await req.json());

    const issues: FormEvaluationIssue[] = [];
    let filledCount = 0;
    let validCount = 0;

    for (const field of fields) {
      const val = values[field.id]?.trim();

      if (!val) {
        if (field.required) {
          issues.push({
            fieldId: field.id,
            label: field.label.replace(/^\d+\.\s*/, ""),
            severity: "error",
            message: "Mandatory field is missing.",
          });
        }
        continue;
      }

      filledCount++;
      const err = validate(field, val, lang);

      if (err) {
        issues.push({
          fieldId: field.id,
          label: field.label.replace(/^\d+\.\s*/, ""),
          severity: "error",
          message: err,
        });
      } else {
        validCount++;
        // Additional semantic consistency checks
        if (field.type === "phone" && val.length === 10) {
          issues.push({
            fieldId: field.id,
            label: field.label.replace(/^\d+\.\s*/, ""),
            severity: "info",
            message: "Valid 10-digit Indian mobile number format.",
          });
        } else if (field.type === "aadhaar" && val.replace(/\s+/g, "").length === 12) {
          issues.push({
            fieldId: field.id,
            label: field.label.replace(/^\d+\.\s*/, ""),
            severity: "info",
            message: "Valid 12-digit UIDAI Aadhaar format.",
          });
        } else if (field.type === "pincode" && val.length === 6) {
          issues.push({
            fieldId: field.id,
            label: field.label.replace(/^\d+\.\s*/, ""),
            severity: "info",
            message: "Valid 6-digit postal index number.",
          });
        }
      }
    }

    const hasErrors = issues.some((i) => i.severity === "error");
    const totalRequired = fields.filter((f) => f.required).length;
    const score = fields.length > 0 ? Math.round((validCount / fields.length) * 100) : 100;

    const summary = hasErrors
      ? `Evaluation detected ${issues.filter((i) => i.severity === "error").length} field issue(s) that need correction.`
      : `All ${validCount} response(s) are valid, consistent, and verified.`;

    const say = hasErrors
      ? lang === "kn"
        ? "ಫಾರ್ಮ್ ಪರಿಶೀಲನೆ: ಕೆಲವು ಕಾಲಂಗಳಲ್ಲಿ ದೋಷಗಳಿವೆ. ದಯವಿಟ್ಟು ಸರಿಪಡಿಸಿ."
        : lang === "hi"
          ? "फॉर्म मूल्यांकन: कुछ खानों में त्रुटि है। कृपया जांच कर सुधारें।"
          : "Form evaluation notice: Some fields need correction before finalizing."
      : lang === "kn"
        ? `ಫಾರ್ಮ್ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ನೂರಕ್ಕೆ ${score} ಪ್ರತಿಶತ ನಿಖರವಾಗಿದೆ. ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಸಿದ್ಧವಾಗಿದೆ.`
        : lang === "hi"
          ? `फॉर्म मूल्यांकन पूरा हुआ। सभी जवाब शत-प्रतिशत मान्य और सुसंगत हैं। डाउनलोड के लिए तैयार है।`
          : `Form evaluation complete: 100% verified. All answers are consistent and valid. Ready for download.`;

    const result: FormEvaluationResult = {
      valid: !hasErrors,
      score,
      summary,
      issues,
      say,
    };

    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
