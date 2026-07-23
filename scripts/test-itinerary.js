const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

function buildTestTemplate() {
  const existingPath = path.join(process.cwd(), 'public/templates/visa/sponsorship-letter-template.docx');
  const existingBuffer = fs.readFileSync(existingPath);

  const travelItineraryXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">PROPOSED TOURIST TRAVEL ITINERARY FOR {destination_country_upper}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="160"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">DAILY ITINERARY:</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t>{-w:p #days}</w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:spacing w:before="140" w:after="40"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
        <w:t xml:space="preserve">{day_title}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t>{-w:p #slots}</w:t></w:r></w:p>
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
  </w:body>
</w:document>`;

  const zip = new PizZip(existingBuffer);
  zip.file('word/document.xml', travelItineraryXml);
  return zip.generate({ type: 'nodebuffer' });
}

const templateBuf = buildTestTemplate();
const zip = new PizZip(templateBuf);
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

const sampleData = {
  destination_country_upper: "CANADA",
  days: [
    {
      day_title: "Day 1: July 28th, 2026 -- Arrival in Toronto",
      slots: [
        { label: "Afternoon", activity: "Arrival in Toronto. Settle into the hotel." },
        { label: "Evening", activity: "Family dinner and relaxation while preparing ourselves ahead of the adventure." }
      ]
    },
    {
      day_title: "Day 2: July 29th, 2026 -- Evergreen Brick Works & Ripley's Aquarium",
      slots: [
        { label: "Morning", activity: "Ice skate at Evergreen Brick Works Winter Village." },
        { label: "Afternoon", activity: "Visit Ripley's Aquarium, featuring holiday dive shows with my family." },
        { label: "Evening", activity: "Have a Sumptuous family dinner." }
      ]
    },
    {
      day_title: "Day 3: July 30th, 2026 -- Hockey Hall of Fame & CN Tower",
      slots: [
        { label: "Morning", activity: "Visit the Hockey Hall of Fame to learn about Canada's favorite sport." },
        { label: "Afternoon", activity: "Trip with my family to the CN Tower." },
        { label: "Evening", activity: "Spend the early evenings at St. Lawrence Market, and a walk through Kensington Market." }
      ]
    }
  ]
};

doc.render(sampleData);
const buf = doc.getZip().generate({ type: 'nodebuffer' });
fs.writeFileSync(path.join(process.cwd(), 'test_itinerary_result.docx'), buf);

const resultZip = new PizZip(buf);
const resultXml = resultZip.file('word/document.xml').asText();
console.log('Result XML substring around DAILY ITINERARY:');
const idx = resultXml.indexOf('DAILY ITINERARY:');
console.log(resultXml.substring(idx));
