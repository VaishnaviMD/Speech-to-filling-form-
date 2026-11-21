// Generates the demo forms in public/samples. Run: node scripts/make-samples.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const FORMS = [
  {
    file: "pension-form.pdf",
    title: "Old Age Pension Scheme - Application Form",
    dept: "Department of Social Welfare (SAMPLE FORM FOR DEMONSTRATION)",
    fields: [
      ["applicant_name", "1. Full name of applicant"],
      ["father_husband_name", "2. Father's / Husband's name"],
      ["dob", "3. Date of birth (DD/MM/YYYY)"],
      ["gender", "4. Gender (Male / Female / Other)"],
      ["aadhaar", "5. Aadhaar number"],
      ["mobile", "6. Mobile number"],
      ["address", "7. Permanent address", { tall: true }],
      ["pincode", "8. PIN code"],
      ["bank_account", "9. Bank account number (for DBT)"],
      ["ifsc", "10. IFSC code of bank branch"],
    ],
    checkbox: ["declaration", "I declare that the information given above is true and I am not receiving any other pension."],
  },
  {
    file: "scholarship-form.pdf",
    title: "Post-Matric Scholarship - Application Form",
    dept: "Department of Education (SAMPLE FORM FOR DEMONSTRATION)",
    fields: [
      ["student_name", "1. Name of student"],
      ["dob", "2. Date of birth (DD/MM/YYYY)"],
      ["institution", "3. Name of school / college"],
      ["course", "4. Course and year of study"],
      ["category", "5. Category (General / OBC / SC / ST / EWS)"],
      ["family_income", "6. Annual family income (Rs.)"],
      ["mobile", "7. Mobile number"],
      ["email", "8. Email ID (optional)"],
      ["bank_account", "9. Bank account number"],
      ["ifsc", "10. IFSC code"],
    ],
    checkbox: ["declaration", "I declare that the above information is correct to the best of my knowledge."],
  },
];

for (const spec of FORMS) {
  const doc = await PDFDocument.create();
  doc.setTitle(spec.title);
  doc.setAuthor("FormSathi AI sample");
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const form = doc.getForm();
  const ink = rgb(0.1, 0.1, 0.12);

  page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: rgb(0.96, 0.93, 0.86) });
  page.drawText(spec.title, { x: 40, y: 808, size: 17, font: bold, color: ink });
  page.drawText(spec.dept, { x: 40, y: 788, size: 9.5, font, color: rgb(0.4, 0.35, 0.3) });
  page.drawText("Fill in BLOCK LETTERS. Fields marked optional may be left blank.", { x: 40, y: 748, size: 9, font, color: ink });

  let y = 712;
  for (const [name, label, opts] of spec.fields) {
    const h = opts?.tall ? 40 : 20;
    y -= h - 20; // tall boxes grow downward so they don't collide with the row above
    page.drawText(label, { x: 40, y: y + h - 14, size: 10.5, font, color: ink });
    const tf = form.createTextField(name);
    if (opts?.tall) tf.enableMultiline();
    tf.addToPage(page, { x: 270, y, width: 285, height: h, font, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 1 });
    tf.setFontSize(10);
    y -= h + 22;
  }

  const [cbName, cbText] = spec.checkbox;
  const cb = form.createCheckBox(cbName);
  cb.addToPage(page, { x: 40, y: y + 4, width: 14, height: 14, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1 });
  page.drawText(cbText, { x: 62, y: y + 7, size: 9.5, font, color: ink, maxWidth: 490 });

  y -= 70;
  page.drawText("Signature / thumb impression of applicant: ____________________", { x: 40, y, size: 10, font, color: ink });
  page.drawText("Date: ______________", { x: 420, y, size: 10, font, color: ink });

  page.drawRectangle({ x: 40, y: 60, width: 515, height: 70, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
  page.drawText("FOR OFFICE USE ONLY", { x: 50, y: 112, size: 9, font: bold, color: rgb(0.45, 0.45, 0.45) });
  page.drawText("Application no: ________   Verified by: ________   Approved: Yes / No", { x: 50, y: 90, size: 9, font, color: rgb(0.45, 0.45, 0.45) });

  await mkdir("public/samples", { recursive: true });
  await writeFile(`public/samples/${spec.file}`, await doc.save());
  console.log("wrote", spec.file);
}
