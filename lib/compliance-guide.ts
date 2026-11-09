import { OFFICIAL_POLICY_CATEGORIES } from "./types/compliance";

export const GUIDE_GROUPS = ["All rules", "Attendance", "Communication", "Work & files", "Conduct"] as const;
export type GuideGroup = typeof GUIDE_GROUPS[number];

const DETAILS: Record<string, { group: GuideGroup; description: string; note?: string }> = {
  "Client information / processing error": { group: "Work & files", description: "Classify client-data and processing errors using the six-level matrix.", note: "First accidental error: correction and feedback without occurrences. Repeated errors require documented previous coaching. Serious or deliberate breaches require formal review." },
  "Missed clock-in": { group: "Attendance", description: "A verified missing clock-in record without an approved exception.", note: "Each occurrence is a half-day deduction. Apply the deduction on the third occurrence, after checking for approved leave, authorised off-site work and genuine system or recording errors." },
  "Missed clock-out": { group: "Attendance", description: "A verified missing clock-out record without an approved exception.", note: "Each occurrence is a half-day deduction. Apply the deduction on the third occurrence, after checking for approved corrections and genuine system or recording errors." },
  "Missed clock-in and clock-out": { group: "Attendance", description: "Both clock records are missing for the same day.", note: "Each record counts separately: a half-day deduction for the missing clock-in and another half-day deduction for the missing clock-out. Verify exceptions and recording errors before applying deductions." },
  "Missed Daily To-do List": { group: "Work & files", description: "A verified missed daily to-do list.", note: "Half an occurrence per verified miss, with correction and coaching as needed." },
  "Missed End-of-Day Report": { group: "Work & files", description: "A verified missed end-of-day report.", note: "Half an occurrence per verified miss, with correction and coaching as needed." },
  "Absence": { group: "Attendance", description: "An unapproved absence from work." },
  "Tardies": { group: "Attendance", description: "Lateness: arriving late without permission.", note: "Count unauthorized late days by calendar month. Apply a one-day pay deduction for the third and each subsequent late day. Check approved exceptions before classifying a late arrival." },
  "Early departure without permission": { group: "Attendance", description: "Leaving work or a shift before closing time without approval." },
  "Failure to clock in/out": { group: "Attendance", description: "Not recording your attendance as required." },
  "Extended or unapproved breaks": { group: "Attendance", description: "Exceeding your break time without approval." },
  "Absence from required meetings": { group: "Attendance", description: "Missing a scheduled meeting or training without notice." },
  "Missing prayer time": { group: "Attendance", description: "Missing scheduled prayer or devotion without approval or a valid reason." },
  "Customer Complaint": { group: "Communication", description: "A verified complaint from a client." },
  "Recurring client complaint": { group: "Communication", description: "A repeat verified complaint from the same client or about the same issue after resolution.", note: "Repeat complaints require an escalation review." },
  "Delayed response to clients or management": { group: "Communication", description: "Not replying within the required response time." },
  "Missed message": { group: "Communication", description: "Missing a work message that required action." },
  "Late response to message": { group: "Communication", description: "Replying outside the agreed response time." },
  "Not acknowledging message": { group: "Communication", description: "Not confirming receipt of an instruction or task message." },
  "Missed mail": { group: "Communication", description: "Not reading, acting on or replying to an official email that needed action.", note: "May count as 1 occurrence if it causes client or financial impact." },
  "Failure to report incidents": { group: "Communication", description: "Not escalating an issue, error or client problem." },
  "Missed Daily To-do-List/Report": { group: "Work & files", description: "Not submitting a required daily task log or report." },
  "Not Meeting Deadlines": { group: "Work & files", description: "An unexcused failure to deliver work on time." },
  "Poor work quality / negligence": { group: "Work & files", description: "Repeated avoidable errors or carelessness." },
  "Negligence causing financial loss": { group: "Work & files", description: "Carelessness that costs the company money.", note: "Serious cases require a suspension review." },
  "Errors during client application review": { group: "Work & files", description: "Mistakes, omissions or incorrect submissions while reviewing a client application.", note: "Apply the six-level client-error matrix, considering severity and client impact. A first-time mistake may still warrant a higher occurrence value or stricter action." },
  "Cloud default": { group: "Work & files", description: "Not saving, uploading, organizing or sharing files in the approved company cloud.", note: "May count as 1 occurrence if files are lost or exposed." },
  "Spreadsheet default": { group: "Work & files", description: "Incorrect or late spreadsheet updates, missing entries or broken formulas.", note: "May count as 1 occurrence if a client, report or financial figures are affected." },
  "Insubordination": { group: "Conduct", description: "Deliberate insubordination requires a fair review of evidence and policy.", note: "Step 5 or higher may be considered after review; the system does not automatically impose a suspension." },
  "Not taking correction": { group: "Conduct", description: "Ignoring or resisting a documented correction, or repeating the mistake.", note: "Open defiance is treated as insubordination." },
  "Misuse of company time or resources": { group: "Conduct", description: "Personal use of company time, phones, internet, systems or equipment.", note: "May count as 1 occurrence for serious or repeated misuse." },
  "Dress code or conduct violation": { group: "Conduct", description: "Unprofessional appearance or behavior." },
  "Default in Company Policy/SOP": { group: "Conduct", description: "Not following company policy or standard operating procedures." },
  "Other": { group: "Conduct", description: "Another policy issue requiring a documented review." },
};

export const COMPLIANCE_GUIDE_RULES = OFFICIAL_POLICY_CATEGORIES.map(category => ({
  ...category,
  ...DETAILS[category.type],
  group: DETAILS[category.type]?.group ?? "Conduct",
  description: DETAILS[category.type]?.description ?? category.unitText,
}));

export function filterComplianceRules(search: string, group: GuideGroup) {
  const terms = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return COMPLIANCE_GUIDE_RULES.filter(rule => (group === "All rules" || rule.group === group)
    && terms.every(term => `${rule.type} ${rule.description} ${rule.note ?? ""}`.toLocaleLowerCase().includes(term)));
}
