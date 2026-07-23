const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

function createDocxTemplate() {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <!-- APPLICANT ADDRESS (RIGHT ALIGNED) & DATE -->
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
        <w:spacing w:line="276" w:lineRule="auto" w:after="0"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{applicant_address}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
        <w:spacing w:line="276" w:lineRule="auto" w:after="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{letter_date}</w:t>
      </w:r>
    </w:p>

    <!-- CONSULAR ADDRESS (LEFT ALIGNED) -->
    <w:p>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:after="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{consular_address}</w:t>
      </w:r>
    </w:p>

    

    <!-- SUBJECT HEADING -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="120" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>TRAVEL ITINERARY FOR MY PROPOSED TRIP TO {destination_country_upper}</w:t>
      </w:r>
    </w:p>


    <!-- SALUTATION -->
    <w:p>
      <w:pPr>
        <w:spacing w:after="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Dear Sir/Ma,</w:t>
      </w:r>
    </w:p>

    <!-- NARRATIVE PARAGRAPH -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:spacing w:line="276" w:lineRule="auto" w:after="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>My name is </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{applicant_name}</w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t> with {origin_country} passport number </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{applicant_passport}</w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{applicant_visa_info}. I am applying for a temporary visit visa to your esteemed country with the intent of {purpose_of_visit}{family_narrative}. We intend to arrive in {arrival_city}, {destination_country} on {arrival_date} and depart for {origin_country} on {departure_date}. During our stay, we will be staying at </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{accommodation_name}, {accommodation_address}</w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>. My plans include {activities_highlights}</w:t>
      </w:r>
    </w:p>

    <!-- MY ACTIVITIES HEADER -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>MY ACTIVITIES:</w:t>
      </w:r>
    </w:p>

    <!-- ACTIVITIES BULLETS/SUMMARY -->
    <w:p>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>1.    Arrival in {destination_country}: I plan to arrive in {destination_country} on {arrival_date} and stay at {accommodation_full}. This will serve as our base for the duration of the trip.</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>2.    Cultural Excursions and Nature Exploration: My itinerary includes visits to iconic cultural landmarks, museums, and art galleries to gain insights into {destination_country}'s rich heritage and natural beauty in the following order:</w:t>
      </w:r>
    </w:p>

    <!-- ACCOMMODATION LINE -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>ACCOMMODATION:  </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{accommodation_full}</w:t>
      </w:r>
    </w:p>

    <!-- DAY BY DAY LOOP -->
    <w:p><w:r><w:t>{#days}</w:t></w:r></w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:before="180" w:after="60"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{day_title}</w:t>
      </w:r>
    </w:p>

    <w:p><w:r><w:t>{#slots}</w:t></w:r></w:p>
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
        <w:spacing w:after="40"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>•   {label}: </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{activity}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t>{/slots}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{/days}</w:t></w:r></w:p>

    <!-- CLOSING DECLARATIONS & SIGN-OFF -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:line="276" w:lineRule="auto" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>I have attached copies of our flight, hotel reservation other important documents to support our application. I assure you of our intention to abide by all the laws and regulations of {destination_country} during our visit, and I will ensure our departure before the expiration of our authorized stay.</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Thank you for considering our visa application. I am eagerly looking forward to experiencing the warmth and hospitality of {destination_country}.</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:after="480"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Yours Sincerely,</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:after="0"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{applicant_name}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  const templatePath = path.join(__dirname, '../public/templates/visa/travel-itinerary-template.docx');
  const existingBuffer = fs.readFileSync(templatePath);
  const zip = new PizZip(existingBuffer);

  zip.file('word/document.xml', documentXml);

  const outBuffer = zip.generate({ type: 'nodebuffer' });
  fs.writeFileSync(templatePath, outBuffer);
  console.log('SUCCESS: travel-itinerary-template.docx updated');
}

createDocxTemplate();
