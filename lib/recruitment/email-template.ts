import type { RecruitmentEmailField, RecruitmentEmailInput } from "@/lib/types/recruitment-email";

type Fields = RecruitmentEmailInput["fields"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHYSICAL_INTERVIEW_ADDRESS = "Address: 10A Iberekodo Street, Bridge gate Estate, Agungi. Lekki.";
const PHYSICAL_ARRIVAL_INSTRUCTIONS =
  "Please plan to arrive at least 10 minutes before your scheduled interview time for check-in and necessary paperwork, and prepare ahead for an aptitude test upon arrival. When you arrive, kindly inform the receptionist that you have an interview scheduled.";
const VIRTUAL_ARRIVAL_INSTRUCTIONS =
  "Please join the meeting using the link above a few minutes before the scheduled time.";

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value.trim());
}

export function hasUnresolvedPlaceholders(text: string, allowApplicantTokens = false) {
  const checked = allowApplicantTokens
    ? text.replace(/\{\{(applicant_name|role_title)\}\}/g, "")
    : text;
  return /\{\{[^}]+\}\}|\[[^\]\r\n]+\]/.test(checked);
}

export function visibleEmailFields(definitions: RecruitmentEmailField[], fields: Fields) {
  return definitions.filter(field => !field.when || fields[field.when.field] === field.when.value);
}

export function emailFieldsComplete(definitions: RecruitmentEmailField[], fields: Fields) {
  return visibleEmailFields(definitions, fields).every(field => {
    const value = String(fields[field.key] ?? "").trim();
    if (!value) return !field.required;
    if (/\{\{|\[[^\]]+\]/.test(value) || value.length > 2000) return false;
    if (field.type === "number") return /^\d+$/.test(value) && +value >= 1 && +value <= 480;
    if (field.type === "select") return !!field.options?.[value];
    if (field.type === "url") { try { return new URL(value).protocol === "https:"; } catch { return false; } }
    if (field.type === "time") return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    if (field.type === "date" || field.type === "datetime-local") return !Number.isNaN(Date.parse(value));
    return true;
  }) && !(fields.deadline && fields.questions_date && String(fields.deadline).slice(0, 10) < String(fields.questions_date));
}

function ordinalSuffix(day: number) {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  return `${day}${["th", "st", "nd", "rd"][day % 10] ?? "th"}`;
}

function formatFieldValues(
  definitions: RecruitmentEmailField[],
  fields: Fields,
  options?: { longInterviewDate?: boolean },
) {
  const values: Record<string, string> = {};
  for (const field of definitions) {
    const raw = String(fields[field.key] ?? "").trim();
    if (!raw) continue;
    let value = raw;
    if (["date", "datetime-local"].includes(field.type)) {
      const date = new Date(`${raw}${field.type === "date" ? "T00:00" : ""}:00+01:00`);
      if (!Number.isNaN(date.getTime())) {
        if (options?.longInterviewDate && field.key === "interview_date" && field.type === "date") {
          const weekday = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "Africa/Lagos" });
          const month = date.toLocaleDateString("en-US", { month: "long", timeZone: "Africa/Lagos" });
          const day = Number(date.toLocaleDateString("en-US", { day: "numeric", timeZone: "Africa/Lagos" }));
          const year = date.toLocaleDateString("en-US", { year: "numeric", timeZone: "Africa/Lagos" });
          value = `${weekday}, ${month} ${ordinalSuffix(day)}, ${year}`;
        } else {
          value = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
          if (field.type === "datetime-local") value += ` at ${raw.slice(11)} (WAT)`;
        }
      }
    } else if (field.type === "time" && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
      const [hour, minute] = raw.split(":").map(Number);
      value = `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
    }
    values[field.key] = value;
  }
  if (fields.delivery_method === "email") values.delivery_details = "email";
  if (fields.delivery_method === "link" && fields.delivery_link) values.delivery_details = `this link: ${fields.delivery_link}`;
  return values;
}

export function previewRecruitmentEmail(
  template: string,
  definitions: RecruitmentEmailField[],
  fields: Fields,
  context?: { applicantName?: string; roleTitle?: string },
) {
  const values = formatFieldValues(definitions, fields);
  if (context?.applicantName?.trim()) values.applicant_name = context.applicantName.trim();
  if (context?.roleTitle?.trim()) values.role_title = context.roleTitle.trim();
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    if (values[key] !== undefined) return values[key];
    if (key === "applicant_name") return "[Applicant name]";
    if (key === "role_title") return "[Role title]";
    return `[${definitions.find(field => field.key === key)?.label ?? "How questions will be shared"}]`;
  });
}

export function previewStandaloneRecruitmentEmail(
  subjectTemplate: string,
  bodyTemplate: string,
  definitions: RecruitmentEmailField[],
  fields: Fields,
  context: { applicantName?: string; roleTitle?: string; templateKey: string },
) {
  const isStandaloneInvite = context.templateKey === "call_screening_pass";
  const values = formatFieldValues(definitions, fields, { longInterviewDate: isStandaloneInvite });
  values.applicant_name = context.applicantName?.trim() || "[Applicant name]";
  values.role_title = context.roleTitle?.trim() || "[Role applied for]";

  if (isStandaloneInvite) {
    const format = String(fields.interview_format ?? "");
    if (format === "virtual") {
      values.interview_format_label = "Virtual";
      values.interview_details = fields.meeting_link
        ? `Meeting link: ${fields.meeting_link}`
        : "Meeting link: [Meeting link]";
      values.arrival_instructions = VIRTUAL_ARRIVAL_INSTRUCTIONS;
    } else if (format === "physical") {
      values.interview_format_label = "Physical";
      values.interview_details = PHYSICAL_INTERVIEW_ADDRESS;
      values.arrival_instructions = PHYSICAL_ARRIVAL_INSTRUCTIONS;
    } else {
      values.interview_format_label = "[Interview format]";
      values.interview_details = "[Interview details]";
      values.arrival_instructions = "[Arrival instructions]";
    }
  }

  const replace = (text: string) =>
    text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
      if (values[key] !== undefined) return values[key];
      const def = definitions.find(field => field.key === key);
      return `[${def?.label ?? key}]`;
    });

  return {
    subject: replace(subjectTemplate),
    body: replace(bodyTemplate),
  };
}

function titleFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

export type ParsedRecipientPaste = {
  name: string;
  email: string;
  interview_date?: string;
  interview_time?: string;
  meeting_link?: string;
};

export function parseRecipientPaste(raw: string): ParsedRecipientPaste[] {
  const seen = new Set<string>();
  const results: ParsedRecipientPaste[] = [];

  const chunks = raw
    .split(/\r?\n/)
    .flatMap(line => (line.includes("<") && line.includes(";") ? line.split(";") : [line]))
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of chunks) {
    let name = "";
    let email = "";
    let interview_date: string | undefined;
    let interview_time: string | undefined;
    let meeting_link: string | undefined;

    const angleMatch = line.match(/^(.*?)\s*<([^<>\s]+@[^<>\s]+)>\s*,?$/);
    if (angleMatch) {
      name = angleMatch[1].replace(/^["']|["']$/g, "").trim();
      email = angleMatch[2].trim();
    } else {
      const parts = line
        .split(/\t|,|\||;/)
        .map(part => part.replace(/^["']|["']$/g, "").trim())
        .filter(Boolean);

      if (parts.length === 1 && isValidEmail(parts[0])) {
        email = parts[0];
        name = titleFromEmail(email);
      } else if (parts.length >= 2) {
        const emailIndex = parts.findIndex(isValidEmail);
        if (emailIndex === -1) continue;
        email = parts[emailIndex];
        const nameParts: string[] = [];
        for (let idx = 0; idx < parts.length; idx++) {
          if (idx === emailIndex) continue;
          const token = parts[idx];
          if (!meeting_link && /^https:\/\/\S+$/i.test(token)) {
            meeting_link = token;
          } else if (!interview_date && /^\d{4}-\d{2}-\d{2}$/.test(token)) {
            interview_date = token;
          } else if (!interview_time && /^([01]?\d|2[0-3]):[0-5]\d$/.test(token)) {
            const [hh, mm] = token.split(":");
            interview_time = `${hh.padStart(2, "0")}:${mm}`;
          } else {
            nameParts.push(token);
          }
        }
        name = nameParts.join(" ").trim() || titleFromEmail(email);
      } else {
        continue;
      }
    }

    if (!isValidEmail(email)) continue;
    const normalized = email.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    const entry: ParsedRecipientPaste = { name: name || titleFromEmail(email), email };
    if (interview_date) entry.interview_date = interview_date;
    if (interview_time) entry.interview_time = interview_time;
    if (meeting_link) entry.meeting_link = meeting_link;
    results.push(entry);
  }

  return results;
}
