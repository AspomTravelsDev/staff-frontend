import type { RecruitmentEmailField } from "./recruitment-email";

export interface StandaloneEmailInput {
  revision: number;
  applicant_name: string;
  recipient: string;
  role_title: string;
  template: string;
  fields: Record<string, string | number | null>;
  subject: string;
  body: string;
}

export interface StandaloneEmailRecord extends Omit<StandaloneEmailInput, "fields"> {
  id: string;
  template_fields: StandaloneEmailInput["fields"];
  status: "draft" | "sending" | "sent" | "failed";
  sender: { id: string; name: string };
  sent_at: string | null;
  updated_at: string;
  signature_html?: string;
}

export type StandaloneEmailHistory = Pick<StandaloneEmailRecord, "id" | "applicant_name" | "recipient" | "role_title" | "template" | "subject" | "status" | "revision" | "sent_at" | "updated_at">;

export interface StandaloneEmailComposer {
  templates: {
    key: string; stage: string; stage_label: string; outcome: "pass" | "fail";
    subject_template: string; body_template: string; field_definitions: RecruitmentEmailField[];
  }[];
  signature_html: string;
  cc: string | null;
  reply_to: string;
  history: StandaloneEmailHistory[];
}
