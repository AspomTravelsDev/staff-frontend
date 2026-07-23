const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const templatePath = path.join(__dirname, '../public/templates/visa/travel-itinerary-template.docx');
const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);

const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  nullGetter() {
    return "";
  },
});

const payload = {
  applicant_address: "No 1 Yetunde Oweseni close,\nIkosi Ketu,\nLagos State,\nNigeria.",
  letter_date: "May 5th, 2026",
  consular_address: "The Consular General,\nBrazil Consulate,\nPlot 257, Kofo Abayomi Street,\nVictoria Island,\n101241, Lagos State.",
  destination_country_upper: "BRAZIL",
  destination_country: "Brazil",
  applicant_name: "OLUPOJO ABIMBOLA IFEOLUWA",
  applicant_passport: "B51396497",
  origin_country: "Nigerian",
  applicant_visa_info: "",
  purpose_of_visit: "a Tourist visa. I am writing to inform you of my planned itinerary for my upcoming tourist visit to São Paulo, Brazil",
  has_family: false,
  family_narrative: "",
  arrival_city: "São Paulo",
  arrival_date: "August 22nd, 2026",
  departure_date: "September 2nd, 2026",
  accommodation_name: "DOUBLETREE BY HILTON SAO PAULO ITAIM",
  accommodation_address: "Rua Manuel Guedes 320 - Itaim Bibi Sao Paulo, 04536-070 Brazil",
  accommodation_full: "DOUBLETREE BY HILTON SAO PAULO ITAIM, Rua Manuel Guedes 320 - Itaim Bibi Sao Paulo, 04536-070 Brazil",
  activities_highlights: "exploring São Paulo Tourist iconic attractions such as Ibirapuera Park, São Paulo Cathedral, Botanical Garden of São Paulo, and Municipal Theatre, which offers spectacular seasonal activities.",
  days: [
    {
      day_title: "Day 1: August 22nd, 2026-- Arrival in São Paulo",
      slots: [
        { label: "Evening", activity: "Arrive in São Paulo and check into my hotel, relax and get acclimated by visiting Ibirapuera Park, enjoy dinner in Vila Madalena." }
      ]
    },
    {
      day_title: "Day 2: August 23rd, 2026-- Downtown Culture",
      slots: [
        { label: "Morning", activity: "Tour the historic downtown area, visiting the São Paulo Cathedral and Pátio do Colégio." },
        { label: "Afternoon", activity: "Head to the Municipal Market for local delicacies. Don’t miss the famous mortadella sandwich!" },
        { label: "Evening", activity: "Dinner and samba show at a local venue for an immersive cultural experience" }
      ]
    }
  ],
};

try {
  doc.render(payload);
  const buf = doc.getZip().generate({ type: 'nodebuffer' });
  fs.writeFileSync(path.join(__dirname, 'test_brazil_output.docx'), buf);

  // Extract rendered XML text
  const renderedZip = new PizZip(buf);
  const xml = renderedZip.file('word/document.xml').asText();
  console.log("SUCCESS: Brazil itinerary rendered clean XML!");
  console.log(xml.slice(xml.indexOf("TRAVEL ITINERARY"), xml.indexOf("I have attached")));
} catch (e) {
  console.error("RENDER ERROR:", e);
}
