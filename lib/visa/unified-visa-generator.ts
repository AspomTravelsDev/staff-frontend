import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { format, addDays } from "date-fns";

export interface UnifiedVisaProfileData {
  // 1. Applicant Profile
  applicant_name: string;
  applicant_passport: string;
  nationality: string;
  applicant_address: string;
  gender: "male" | "female";

  // 2. Embassy & Date
  letter_date: Date;
  selected_country_key: string;
  embassy_name: string;
  embassy_address: string;
  consular_address: string;

  // 3. Trip & Accommodation
  destination_country: string;
  arrival_city: string;
  travel_start_date: Date;
  travel_end_date: Date;
  duration_days: 7 | 14;
  accommodation_name: string;
  accommodation_address: string;
  purpose_of_visit: string;
  activities_highlights: string;

  // 4. Family Members & Schedule Days
  familyMembers: Array<{
    relationship: string;
    name: string;
    passport_number: string;
    visa_details: string;
  }>;
  days: Array<{
    day_title: string;
    morning_activity: string;
    afternoon_activity: string;
    evening_activity: string;
  }>;

  // 5. Employment & Intro Details
  employment_type: "employed" | "self_employed";
  job_title: string;
  company_name: string;
  employment_start_date: Date;
  business_name: string;
  business_nature: string;
  registration_number: string;
  signatory_name: string;
  signatory_designation: string;
  signatory_contact_info: string;
  self_signatory_name: string;
  self_signatory_designation: string;
  self_signatory_address: string;
  self_signatory_phone: string;
  self_signatory_email: string;

  // 6. Financial & Explanation Details
  bank_name: string;
  account_number_ending: string;
  closing_balance: string;
  source_of_funds: string;
  home_ties_summary: string;
  additional_notes: string;

  // 7. Sponsorship Details
  sponsor_name: string;
  sponsor_id_number: string;
  sponsor_address: string;
  sponsor_profession: string;
  sponsor_business_name: string;
  sponsor_business_description: string;
  sponsor_designation: string;
  sponsor_phone: string;
  sponsor_email: string;
  relationship_to_applicant: string;
}

// Helper to format ordinal dates
function formatDateWithOrdinal(date: Date): string {
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const monthStr = format(date, "MMMM");
  const dayStr = getOrdinal(date.getDate());
  const yearStr = format(date, "yyyy");
  return `${monthStr} ${dayStr}, ${yearStr}`;
}

async function renderDocxBuffer(templateUrl: string, data: Record<string, any>): Promise<ArrayBuffer> {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Failed to load template from ${templateUrl}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter() {
      return "";
    },
  });
  doc.render(data);
  return doc.getZip().generate({
    type: "arraybuffer",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function formatAddressWithLineBreaks(rawAddress: string): string {
  if (!rawAddress || !rawAddress.trim()) return "";
  const clean = rawAddress.replace(/\r\n/g, "\n");
  const parts = clean
    .split(/,|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return rawAddress.trim();
  return parts.join(",\n");
}

export function buildPayloads(profile: UnifiedVisaProfileData) {
  const nameParts = profile.applicant_name.trim().split(" ");
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : profile.applicant_name;
  const formattedLetterDate = formatDateWithOrdinal(profile.letter_date);
  const formattedArrivalDate = formatDateWithOrdinal(profile.travel_start_date);
  const formattedDepartureDate = formatDateWithOrdinal(profile.travel_end_date);

  const formattedApplicantAddress = formatAddressWithLineBreaks(profile.applicant_address);
  const formattedSponsorAddress = formatAddressWithLineBreaks(profile.sponsor_address || profile.applicant_address);
  const formattedSelfSignatoryAddress = formatAddressWithLineBreaks(profile.self_signatory_address);

  const pronounSubject = profile.gender === "female" ? "she" : "he";
  const pronounSubjectCap = profile.gender === "female" ? "She" : "He";
  const pronounPossessive = profile.gender === "female" ? "her" : "his";
  const pronounObject = profile.gender === "female" ? "her" : "him";

  const applicantNameUpper = profile.applicant_name ? profile.applicant_name.toUpperCase() : "";
  const rawSponsorAddress = profile.sponsor_address || profile.applicant_address || "";
  const sponsorAddressHeader = formatAddressWithLineBreaks(rawSponsorAddress);
  const sponsorAddressInline = rawSponsorAddress.replace(/[\r\n]+/g, ", ").replace(/,\s*,/g, ", ").trim();

  // 1. Travel Itinerary Payload
  const familyNarrative = profile.familyMembers.length > 0
    ? ` together with my family: ${profile.familyMembers.map((m) => `${m.relationship ? m.relationship.toLowerCase() + " " : ""}${m.name} (${m.passport_number})`).join(" and ")}`
    : "";

  const itineraryPayload = {
    applicant_address: formattedApplicantAddress,
    letter_date: formattedLetterDate,
    consular_address: profile.consular_address,
    destination_country_upper: profile.destination_country.toUpperCase(),
    destination_country: profile.destination_country,
    applicant_name: profile.applicant_name,
    applicant_name_upper: applicantNameUpper,
    applicant_passport: profile.applicant_passport,
    origin_country: profile.nationality,
    applicant_visa_info: "",
    purpose_of_visit: profile.purpose_of_visit,
    has_family: profile.familyMembers.length > 0,
    family_narrative: familyNarrative,
    arrival_city: profile.arrival_city,
    arrival_date: formattedArrivalDate,
    departure_date: formattedDepartureDate,
    accommodation_name: profile.accommodation_name,
    accommodation_address: profile.accommodation_address,
    accommodation_full: `${profile.accommodation_name}, ${profile.accommodation_address}`,
    activities_highlights: profile.activities_highlights,
    days: profile.days.map((d) => {
      const slots: Array<{ label: string; activity: string }> = [];
      if (d.morning_activity && d.morning_activity.trim()) {
        slots.push({ label: "Morning", activity: d.morning_activity.trim() });
      }
      if (d.afternoon_activity && d.afternoon_activity.trim()) {
        slots.push({ label: "Afternoon", activity: d.afternoon_activity.trim() });
      }
      if (d.evening_activity && d.evening_activity.trim()) {
        slots.push({ label: "Evening", activity: d.evening_activity.trim() });
      }
      return {
        day_title: d.day_title,
        slots,
      };
    }),
  };

  // 2. Introduction Letter Payload
  const introTemplateUrl = profile.employment_type === "employed"
    ? "/templates/visa/introduction-letter-employed-template.docx"
    : "/templates/visa/introduction-letter-self-employed-template.docx";

  const introPayload = profile.employment_type === "employed"
    ? {
        document_date: formattedLetterDate,
        embassy_name: profile.embassy_name,
        embassy_address: profile.embassy_address,
        applicant_name: profile.applicant_name,
        applicant_name_upper: applicantNameUpper,
        applicant_last_name: lastName,
        company_name: profile.company_name,
        job_title: profile.job_title,
        employment_start_date: formatDateWithOrdinal(profile.employment_start_date),
        destination_country: profile.destination_country,
        travel_start_date: formattedArrivalDate,
        travel_end_date: formattedDepartureDate,
        pronoun_subject: pronounSubject,
        pronoun_subject_cap: pronounSubjectCap,
        pronoun_possessive: pronounPossessive,
        pronoun_object: pronounObject,
        signatory_name: profile.signatory_name,
        signatory_designation: profile.signatory_designation,
        signatory_contact_info: profile.signatory_contact_info,
      }
    : {
        document_date: formattedLetterDate,
        embassy_name: profile.embassy_name,
        embassy_address: profile.embassy_address,
        applicant_name: profile.applicant_name,
        applicant_name_upper: applicantNameUpper,
        applicant_last_name: lastName,
        business_name: profile.business_name || profile.company_name,
        business_nature: profile.business_nature,
        registration_number: profile.registration_number,
        registration_phrase: profile.registration_number && profile.registration_number.trim() ? `, registered in Nigeria under ${profile.registration_number.trim()}.` : `, registered in Nigeria.`,
        destination_country: profile.destination_country,
        travel_start_date: formattedArrivalDate,
        travel_end_date: formattedDepartureDate,
        pronoun_subject: pronounSubject,
        pronoun_subject_cap: pronounSubjectCap,
        pronoun_possessive: pronounPossessive,
        pronoun_object: pronounObject,
        signatory_name: profile.self_signatory_name || "KEMI ADEBAYO",
        signatory_designation: profile.self_signatory_designation || "Company Secretary",
        signatory_contact_info: [
          formattedSelfSignatoryAddress,
          profile.self_signatory_phone,
          profile.self_signatory_email,
        ]
          .filter(Boolean)
          .join("\n"),
        signatory_address: formattedSelfSignatoryAddress,
        signatory_phone: profile.self_signatory_phone,
        signatory_email: profile.self_signatory_email,
      };

  // 3. Explanation Letter Payload
  const explanationPayload = {
    document_date: formattedLetterDate,
    embassy_title: `The Visa Officer, ${profile.embassy_name}`,
    applicant_name: profile.applicant_name,
    applicant_name_upper: applicantNameUpper,
    passport_number: profile.applicant_passport,
    sponsor_name: profile.sponsor_name ? profile.sponsor_name : `${profile.applicant_name} (Self-Sponsored)`,
    bank_name: profile.bank_name,
    account_number_ending: profile.account_number_ending,
    closing_balance: profile.closing_balance,
    source_of_funds: profile.source_of_funds,
    home_ties_summary: profile.home_ties_summary,
    additional_notes: profile.additional_notes,
  };

  // 4. Sponsorship Letter Payload
  const sponsorshipPayload = {
    embassy_name: profile.embassy_name,
    embassy_address: profile.embassy_address,
    applicant_name: profile.applicant_name,
    applicant_name_upper: applicantNameUpper,
    applicant_passport: profile.applicant_passport,
    pronoun_subject: pronounSubject,
    pronoun_subject_cap: pronounSubjectCap,
    pronoun_possessive: pronounPossessive,
    pronoun_object: pronounObject,
    sponsor_name: profile.sponsor_name || profile.applicant_name,
    sponsor_id_number: profile.sponsor_id_number || profile.applicant_passport,
    sponsor_address_header: sponsorAddressHeader,
    sponsor_address_inline: sponsorAddressInline,
    sponsor_profession: profile.sponsor_profession || "Business Executive",
    sponsor_business_name: profile.sponsor_business_name || "Private Company",
    sponsor_business_description: profile.sponsor_business_description || "Commercial Operations",
    sponsor_designation: profile.sponsor_designation || "Director",
    sponsor_phone: profile.sponsor_phone || "",
    sponsor_email: profile.sponsor_email || "",
    relationship_to_applicant: profile.relationship_to_applicant,
    home_country: profile.nationality,
    destination_country: profile.destination_country,
    travel_start_date: formattedArrivalDate,
    travel_end_date: formattedDepartureDate,
  };

  // 5. Leave Approval Letter Payload
  const resumptionDate = formatDateWithOrdinal(addDays(profile.travel_end_date, 1));
  const leaveApprovalPayload = {
    document_date: formattedLetterDate,
    applicant_name: profile.applicant_name,
    applicant_name_upper: applicantNameUpper,
    job_title: profile.job_title || "Staff",
    company_name: profile.company_name || profile.business_name || "Company",
    travel_start_date: formattedArrivalDate,
    travel_end_date: formattedDepartureDate,
    resumption_date: resumptionDate,
    leave_reason: profile.additional_notes || "personal matters, travel, and visa processing",
    signatory_name: profile.signatory_name || profile.self_signatory_name || "HR Manager",
    signatory_designation: profile.signatory_designation || profile.self_signatory_designation || "Human Resources",
  };

  // 6. Self Introductory Letter Payload
  const employmentNarrative = profile.employment_type === "employed"
    ? `I am currently employed as a ${profile.job_title || "Staff"} at ${profile.company_name || "my organization"}. My employment serves as a stable source of income and demonstrates my strong professional and economic ties to my home country.`
    : `I am currently self-employed as a business owner at ${profile.business_name || profile.company_name || "my business"}, engaged in ${profile.business_nature || "commercial activities"}. My business serves as a stable source of income and demonstrates my strong professional and economic ties to my home country.`;

  const selfIntroPayload = {
    applicant_address: formattedApplicantAddress,
    document_date: formattedLetterDate,
    consular_address: profile.consular_address,
    applicant_name: profile.applicant_name,
    nationality: profile.nationality || "Nigeria",
    applicant_passport: profile.applicant_passport,
    destination_country: profile.destination_country,
    employment_narrative: employmentNarrative,
    purpose_of_visit: profile.purpose_of_visit,
    travel_start_date: formattedArrivalDate,
    travel_end_date: formattedDepartureDate,
    accommodation_full: `${profile.accommodation_name}, ${profile.accommodation_address}`,
  };

  return {
    itineraryPayload,
    introTemplateUrl,
    introPayload,
    explanationPayload,
    sponsorshipPayload,
    leaveApprovalPayload,
    selfIntroPayload,
    cleanName: profile.applicant_name.replace(/\s+/g, "_") || "Applicant",
  };
}

export async function generateSingleDocument(
  docType: "itinerary" | "intro" | "explanation" | "sponsorship" | "leave_approval" | "self_intro",
  profile: UnifiedVisaProfileData
): Promise<void> {
  const {
    itineraryPayload,
    introTemplateUrl,
    introPayload,
    explanationPayload,
    sponsorshipPayload,
    leaveApprovalPayload,
    selfIntroPayload,
    cleanName,
  } = buildPayloads(profile);

  let templateUrl = "";
  let payload: Record<string, any> = {};
  let filename = "";

  switch (docType) {
    case "itinerary":
      templateUrl = "/templates/visa/travel-itinerary-template.docx";
      payload = itineraryPayload;
      filename = `Travel_Itinerary_${cleanName}.docx`;
      break;
    case "intro":
      templateUrl = introTemplateUrl;
      payload = introPayload;
      filename = `Introduction_Letter_${cleanName}.docx`;
      break;
    case "explanation":
      templateUrl = "/templates/visa/explanation-letter-template.docx";
      payload = explanationPayload;
      filename = `Explanation_Letter_${cleanName}.docx`;
      break;
    case "sponsorship":
      templateUrl = "/templates/visa/sponsorship-letter-template.docx";
      payload = sponsorshipPayload;
      filename = `Sponsorship_Letter_${cleanName}.docx`;
      break;
    case "leave_approval":
      templateUrl = "/templates/visa/leave-approval-letter-template.docx";
      payload = leaveApprovalPayload;
      filename = `Leave_Approval_Letter_${cleanName}.docx`;
      break;
    case "self_intro":
      templateUrl = "/templates/visa/self-introductory-letter-template.docx";
      payload = selfIntroPayload;
      filename = `Self_Introductory_Letter_${cleanName}.docx`;
      break;
  }

  const buffer = await renderDocxBuffer(templateUrl, payload);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  saveAs(blob, filename);
}

export async function generateVisaPackageZip(profile: UnifiedVisaProfileData): Promise<void> {
  const {
    itineraryPayload,
    introTemplateUrl,
    introPayload,
    explanationPayload,
    sponsorshipPayload,
    leaveApprovalPayload,
    selfIntroPayload,
    cleanName,
  } = buildPayloads(profile);

  const [itineraryBuf, introBuf, explanationBuf, sponsorshipBuf, leaveApprovalBuf, selfIntroBuf] = await Promise.all([
    renderDocxBuffer("/templates/visa/travel-itinerary-template.docx", itineraryPayload),
    renderDocxBuffer(introTemplateUrl, introPayload),
    renderDocxBuffer("/templates/visa/explanation-letter-template.docx", explanationPayload),
    renderDocxBuffer("/templates/visa/sponsorship-letter-template.docx", sponsorshipPayload),
    renderDocxBuffer("/templates/visa/leave-approval-letter-template.docx", leaveApprovalPayload),
    renderDocxBuffer("/templates/visa/self-introductory-letter-template.docx", selfIntroPayload),
  ]);

  const zip = new JSZip();
  zip.file(`1_Travel_Itinerary_${cleanName}.docx`, itineraryBuf);
  zip.file(`2_Introduction_Letter_${cleanName}.docx`, introBuf);
  zip.file(`3_Explanation_Letter_${cleanName}.docx`, explanationBuf);
  zip.file(`4_Sponsorship_Letter_${cleanName}.docx`, sponsorshipBuf);
  zip.file(`5_Leave_Approval_Letter_${cleanName}.docx`, leaveApprovalBuf);
  zip.file(`6_Self_Introductory_Letter_${cleanName}.docx`, selfIntroBuf);

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `Visa_Application_Package_${cleanName}.zip`);
}
