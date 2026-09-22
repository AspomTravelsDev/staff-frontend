const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

function buildExplanationTemplate() {
  const baseTemplatePath = path.join(process.cwd(), 'public/templates/visa/sponsorship-letter-template.docx');
  const baseBuffer = fs.readFileSync(baseTemplatePath);

  const explanationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <!-- TOP RIGHT HEADER: SENDER ADDRESS & DATE -->
    <w:p>
      <w:pPr><w:jc w:val="right"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_address}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{letter_date}</w:t></w:r>
    </w:p>

    <!-- RECIPIENT EMBASSY ADDRESS -->
    <w:p>
      <w:pPr><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{consular_address}</w:t></w:r>
    </w:p>

    <!-- SALUTATION -->
    <w:p>
      <w:pPr><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Dear Sir/Ma,</w:t></w:r>
    </w:p>

    <!-- SUBJECT LINE (CENTERED & ALL CAPS) -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">EXPLANATION LETTER FOR MY PROPOSED TRIP TO {destination_country_upper}</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 1: INTRO & TRIP PURPOSE -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">My name is </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, and I am the holder of {nationality} passport number </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_passport}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">. I respectfully submit this detailed letter in support of my application for a Temporary Visit Visa to {destination_country}{companion_narrative}. {trip_purpose_narrative}</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 2: BUSINESS / EMPLOYMENT OVERVIEW -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{business_background_narrative}</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 3: ROLE & DUTIES -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{job_duties_narrative}</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 4: TOURISM ACTIVITIES & ITINERARY -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{activities_narrative}</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 5: ACCOMMODATION DETAILS -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{lodging_stay_prefix} </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{accommodation_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, located at {accommodation_address}. {lodging_planning_details}</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 6: SPONSORSHIP & FINANCIAL CAPACITY -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{financial_sponsorship_narrative}</w:t></w:r>
    </w:p>

    {#has_travel_history}
    <!-- PARAGRAPH 7: TRAVEL HISTORY -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{travel_history_narrative}</w:t></w:r>
    </w:p>
    {/has_travel_history}

    <!-- PARAGRAPH 8: HOME TIES -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">I have strong family, professional, and economic ties in {home_country}. {home_ties_summary} I have no personal, professional, or independent ties outside {home_country} that would provide any reason for me to overstay or remain beyond the approved duration of my visit.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 9: IMMIGRATION COMPLIANCE -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">I fully understand and respect the terms and conditions attached to the {destination_country} Temporary Visit Visa, and I will comply strictly with all applicable immigration laws and regulations.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 10: CONCLUSION -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{conclusion_narrative}</w:t></w:r>
    </w:p>

    <!-- SIGN OFF -->
    <w:p>
      <w:pPr><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Yours faithfully,</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_name}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  const zip = new PizZip(baseBuffer);
  zip.file('word/document.xml', explanationXml);
  const targetPath = path.join(process.cwd(), 'public/templates/visa/explanation-letter-template.docx');
  fs.writeFileSync(targetPath, zip.generate({ type: 'nodebuffer' }));
  console.log('Built: explanation-letter-template.docx');
}

module.exports = { buildExplanationTemplate };

if (require.main === module) {
  buildExplanationTemplate();
}
