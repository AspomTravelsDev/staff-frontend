import type { RecruitmentEmailField, RecruitmentEmailInput } from "@/lib/types/recruitment-email";

type Fields = RecruitmentEmailInput["fields"];
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
    if (field.type === "date" || field.type === "datetime-local") return !Number.isNaN(Date.parse(value));
    return true;
  }) && !(fields.deadline && fields.questions_date && String(fields.deadline).slice(0, 10) < String(fields.questions_date));
}

export function previewRecruitmentEmail(template: string, definitions: RecruitmentEmailField[], fields: Fields) {
  const values: Record<string, string> = {};
  for (const field of definitions) {
    const raw = String(fields[field.key] ?? "").trim();
    if (!raw) continue;
    let value = raw;
    if (["date", "datetime-local"].includes(field.type)) {
      const date = new Date(`${raw}${field.type === "date" ? "T00:00" : ""}:00+01:00`);
      if (!Number.isNaN(date.getTime())) {
        value = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
        if (field.type === "datetime-local") value += ` at ${raw.slice(11)} (WAT)`;
      }
    }
    values[field.key] = value;
  }
  if (fields.delivery_method === "email") values.delivery_details = "email";
  if (fields.delivery_method === "link" && fields.delivery_link) values.delivery_details = `this link: ${fields.delivery_link}`;
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => values[key] ?? `[${definitions.find(field => field.key === key)?.label ?? "How questions will be shared"}]`);
}
