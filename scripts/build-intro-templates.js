const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

function buildIntroTemplates() {
  const baseTemplatePath = path.join(process.cwd(), 'public/templates/visa/sponsorship-letter-template.docx');
  const baseBuffer = fs.readFileSync(baseTemplatePath);

  // 1. INTRODUCTION LETTER - EMPLOYED XML
  const introEmployedXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <!-- DATE (RIGHT ALIGNED) -->
    <w:p>
      <w:pPr><w:jc w:val="right"/><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Date: </w:t></w:r>
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
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">INTRODUCTION AND EMPLOYMENT CONFIRMATION – {applicant_name_upper}</w:t></w:r>
    </w:p>

    <!-- SALUTATION -->
    <w:p>
      <w:pPr><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Dear Sir/Madam,</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 1 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">This is to formally introduce </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, who is a valued employee of </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{company_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, currently holding the position of </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{job_title}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">. {applicant_last_name} has been employed with us since </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{employment_start_date}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> and has consistently demonstrated professionalism and commitment in the performance of {pronoun_possessive} duties.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 2 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_last_name} has requested leave from work to travel to </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{destination_country}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> for tourism purposes from </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{travel_start_date}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> to </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{travel_end_date}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">. We confirm that the requested leave has been approved and that {pronoun_subject} will resume duties immediately upon return.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 3 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">We further confirm that {pronoun_subject} receives a regular salary and maintains strong professional and economic ties to Nigeria. This vacation is purely for leisure, and {pronoun_subject} will return to fulfill {pronoun_possessive} responsibilities.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 4 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">We respectfully request that {pronoun_object} be granted the necessary visa for this purpose. Should you require any further information, please do not hesitate to contact us.</w:t></w:r>
    </w:p>

    <!-- SIGN OFF -->
    <w:p>
      <w:pPr><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Yours faithfully,</w:t></w:r>
    </w:p>

    <!-- FOOTER -->
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{signatory_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{signatory_designation}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{company_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="0"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{signatory_contact_info}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  const zipIntroEmployed = new PizZip(baseBuffer);
  zipIntroEmployed.file('word/document.xml', introEmployedXml);
  fs.writeFileSync(path.join(process.cwd(), 'public/templates/visa/introduction-letter-employed-template.docx'), zipIntroEmployed.generate({ type: 'nodebuffer' }));
  fs.writeFileSync(path.join(process.cwd(), 'public/templates/visa/introduction-letter-template.docx'), zipIntroEmployed.generate({ type: 'nodebuffer' }));
  console.log('Built: introduction-letter-employed-template.docx');

  // 2. INTRODUCTION LETTER - SELF-EMPLOYED XML
  const introSelfEmployedXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <!-- DATE (RIGHT ALIGNED) -->
    <w:p>
      <w:pPr><w:jc w:val="right"/><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Date: </w:t></w:r>
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
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">INTRODUCTION AND BUSINESS CONFIRMATION – {applicant_name_upper}</w:t></w:r>
    </w:p>

    <!-- SALUTATION -->
    <w:p>
      <w:pPr><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Dear Sir/Madam,</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 1 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">I am writing in my capacity as </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{signatory_designation}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> to formally introduce </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, the owner and Chief Executive Officer of </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{business_name}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, a company engaged in </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{business_nature}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{registration_phrase}</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 2 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{applicant_last_name} has expressed the intention to travel to </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{destination_country}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> for tourism purposes from </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{travel_start_date}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve"> to </w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{travel_end_date}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">. The purpose of the trip is strictly for leisure.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 3 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">We confirm that {applicant_last_name} is fully capable of funding this trip and has made arrangements to ensure that business operations will continue smoothly during the brief period of absence. {pronoun_subject_cap} maintains strong professional and economic ties to Nigeria and will return immediately upon completion of the vacation.</w:t></w:r>
    </w:p>

    <!-- PARAGRAPH 4 -->
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:line="276" w:lineRule="auto" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">We kindly request your favorable consideration of {applicant_last_name}'s visa application. Should you require further information regarding {pronoun_possessive} business or financial capacity, please do not hesitate to contact me using the details below.</w:t></w:r>
    </w:p>

    <!-- SIGN OFF -->
    <w:p>
      <w:pPr><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Yours faithfully,</w:t></w:r>
    </w:p>

    <!-- FOOTER (FULL SELF-EMPLOYED INTRO SIGN OFF) -->
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{signatory_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{signatory_designation}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{business_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{signatory_phone}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="0"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{signatory_email}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  const zipIntroSelf = new PizZip(baseBuffer);
  zipIntroSelf.file('word/document.xml', introSelfEmployedXml);
  fs.writeFileSync(path.join(process.cwd(), 'public/templates/visa/introduction-letter-self-employed-template.docx'), zipIntroSelf.generate({ type: 'nodebuffer' }));
  console.log('Built: introduction-letter-self-employed-template.docx');
}

module.exports = { buildIntroTemplates };

if (require.main === module) {
  buildIntroTemplates();
}
