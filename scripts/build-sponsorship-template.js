const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

function buildSponsorshipTemplate() {
  const baseTemplatePath = path.join(
    process.cwd(),
    "public/templates/visa/sponsorship-letter-template.docx",
  );
  const baseBuffer = fs.readFileSync(baseTemplatePath);

  const sponsorshipXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <!-- TOP RIGHT HEADER - DATE -->
    <w:p>
      <w:pPr><w:jc w:val="right"/><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{document_date}</w:t></w:r>
    </w:p>

    <!-- RECIPIENT -->
    <w:p>
      <w:pPr><w:spacing w:after="0"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">To:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="0"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">The Visa Officer</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="0"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{embassy_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{embassy_address}</w:t></w:r>
    </w:p>

    <!-- SUBJECT (CENTERED & ALL CAPS) -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">SPONSORSHIP LETTER FOR VISA APPLICATION – {applicant_name_upper}</w:t></w:r>
    </w:p>

    <!-- SALUTATION -->
    <w:p>
      <w:pPr><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Dear Sir/Madam,</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 1 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">I, </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{sponsor_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, holder of ID/Passport No. </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{sponsor_id_number}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, residing at {sponsor_address_inline}, am the {sponsor_profession} of {sponsor_business_name}, specializing in {sponsor_business_description}.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 2 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">I hereby confirm that I will be sponsoring </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, holder of Passport No. </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_passport}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, for {pronoun_possessive} trip to </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{destination_country}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> scheduled from </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{travel_start_date}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> to </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{travel_end_date}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">. I will be responsible for covering all expenses related to this trip, including travel tickets, accommodation, transportation, daily living expenses, and personal costs.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 3 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Relationship to Applicant: </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{relationship_to_applicant}</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 4 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">I also confirm that {pronoun_subject} will return to {home_country} upon completion of the trip, and I take full responsibility for ensuring compliance with all immigration regulations.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 5: FINANCIAL PROOF DOCUMENTS -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Attached are supporting documents to demonstrate my financial capacity to sponsor this trip, including bank statements, proof of income, and any other relevant financial documents.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 6: VISA REQUEST -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">We respectfully request that you grant </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> the necessary visa for this purpose.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 7: FURTHER INFO & THANK YOU -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Should you require any further information or clarification, please feel free to contact me using the details provided below.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Thank you for your kind consideration.</w:t></w:r>
    </w:p>

    <!-- SIGN OFF -->
    <w:p>
      <w:pPr><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Yours faithfully,</w:t></w:r>
    </w:p>

    <!-- FOOTER (FULL SPONSOR SIGN OFF) -->
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{sponsor_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{sponsor_profession}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{sponsor_business_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{sponsor_phone}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="0"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{sponsor_email}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  const zip = new PizZip(baseBuffer);
  zip.file("word/document.xml", sponsorshipXml);
  const targetPath = path.join(
    process.cwd(),
    "public/templates/visa/sponsorship-letter-template.docx",
  );
  fs.writeFileSync(targetPath, zip.generate({ type: "nodebuffer" }));
  console.log("Built: sponsorship-letter-template.docx");
}

module.exports = { buildSponsorshipTemplate };

if (require.main === module) {
  buildSponsorshipTemplate();
}
