export interface RecruitmentEmailRecord {
  id: string;
  event_id: string;
  recipient: string;
  subject: string;
  body: string;
  status: "draft" | "skipped" | "sending" | "sent" | "failed";
  template_fields: Record<string, string | number | null>;
  draft_revision: number;
  is_current_decision?: boolean;
  sender: { id: string; name: string };
  sent_at: string | null;
  skipped_at?: string | null;
  updated_at: string;
}

export interface RecruitmentEmailField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "time" | "datetime-local" | "number" | "url" | "select";
  required: boolean;
  options?: Record<string, string>;
  when?: { field: string; value: string };
}

export interface RecruitmentEmailInput {
  event_id: string;
  revision: number;
  draft_revision: number;
  fields: Record<string, string | number | null>;
}

export interface RecruitmentEmails {
  revision: number;
  recipient: string | null;
  cc: string | null;
  reply_to: string;
  draft: {
    id?: string | null; event_id: string; template: string; subject: string;
    body: string; body_template: string; draft_revision: number;
    fields: RecruitmentEmailInput["fields"]; field_definitions: RecruitmentEmailField[];
  } | null;
  history: RecruitmentEmailRecord[];
  signature_html?: string;
}
