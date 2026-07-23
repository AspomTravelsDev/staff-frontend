const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

function buildItineraryTemplate() {
  const baseTemplatePath = path.join(process.cwd(), 'public/templates/visa/sponsorship-letter-template.docx');
  const baseBuffer = fs.readFileSync(baseTemplatePath);

  const travelItineraryXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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

    <!-- SUBJECT LINE (CENTERED & ALL CAPS) -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">PROPOSED TOURIST TRAVEL ITINERARY FOR {destination_country_upper}</w:t></w:r>
    </w:p>

    <!-- SALUTATION -->
    <w:p>
      <w:pPr><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Dear Sir/Madam,</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 1 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">My name is </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, a citizen of {origin_country} holding Passport No. </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_passport}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">. I intend to travel to {destination_country} for {purpose_of_visit}{family_narrative} from </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{arrival_date}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> to </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{departure_date}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">.</w:t></w:r>
    </w:p>

    <!-- ACCOMMODATION SECTION -->
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">ACCOMMODATION DETAILS:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{accommodation_full}</w:t></w:r>
    </w:p>

    <!-- DAILY ITINERARY HEADING -->
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="160"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">DAILY ITINERARY:</w:t></w:r>
    </w:p>

    <!-- DAYS PARAGRAPH LOOP -->
    <w:p><w:r><w:t>{#days}</w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:spacing w:before="140" w:after="40"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
        <w:t xml:space="preserve">{day_title}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t>{#slots}</w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/><w:ind w:left="360"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
        <w:t xml:space="preserve">• {label}: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
        <w:t xml:space="preserve">{activity}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t>{/slots}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{/days}</w:t></w:r></w:p>

    <!-- FINAL JUSTIFIED PARAGRAPH -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:before="200" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">I trust that this proposed travel itinerary demonstrates my intention for a genuine leisure vacation to {destination_country}. I assure you that I will adhere strictly to all visa conditions and return to {origin_country} upon completion of my visit. Thank you for your kind consideration of my visa application.</w:t></w:r>
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
  zip.file('word/document.xml', travelItineraryXml);
  const targetPath = path.join(process.cwd(), 'public/templates/visa/travel-itinerary-template.docx');
  fs.writeFileSync(targetPath, zip.generate({ type: 'nodebuffer' }));
  console.log('Built: travel-itinerary-template.docx');
}

module.exports = { buildItineraryTemplate };

if (require.main === module) {
  buildItineraryTemplate();
}
