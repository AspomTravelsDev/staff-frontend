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

export type StandaloneEmailHistory = Pick<
  StandaloneEmailRecord,
  "id" | "applicant_name" | "recipient" | "role_title" | "template" | "subject" | "status" | "revision" | "sent_at" | "updated_at"
> & {
  template_fields?: StandaloneEmailInput["fields"];
  body?: string;
};

export interface StandaloneComposerRoleCandidate {
  id: string;
  recruitment_role_id: string;
  name: string;
  email: string;
  pipeline_stage?: string | null;
  pipeline_outcome?: string | null;
  status?: string | null;
}

export interface StandaloneComposerRole {
  id: string;
  title: string;
  department: string;
  status: string;
  candidates: StandaloneComposerRoleCandidate[];
}

export interface StandaloneBatchRecipientInput {
  id: string;
  applicant_name: string;
  recipient: string;
  revision?: number;
  field_overrides?: Record<string, string | number | null>;
}

export interface StandaloneBatchSendInput {
  role_title: string;
  template: string;
  fields: Record<string, string | number | null>;
  custom_subject?: string | null;
  custom_body?: string | null;
  recipients: StandaloneBatchRecipientInput[];
}

export interface StandaloneBatchItemResult {
  id: string;
  applicant_name: string;
  recipient: string;
  status: "sent" | "failed";
  error: string | null;
  record: StandaloneEmailRecord | null;
}

export interface StandaloneBatchSendResponse {
  results: StandaloneBatchItemResult[];
  sent_count: number;
  failed_count: number;
}

export interface StandaloneEmailComposer {
  templates: {
    key: string; stage: string; stage_label: string; outcome: "pass" | "fail";
    subject_template: string; body_template: string; field_definitions: RecruitmentEmailField[];
  }[];
  signature_html: string;
  cc: string | null;
  reply_to: string;
  history: StandaloneEmailHistory[];
  roles?: StandaloneComposerRole[];
}
