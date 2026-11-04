"use server";

import { api, type ApiResponse } from "@/lib/api/client";

export type PayrollRunStatus =
  | "draft"
  | "hr_draft"
  | "account_review"
  | "compliance_review"
  | "mp_review"
  | "md_approval"
  | "closed"
  | "processing";

export interface PayrollApprovalHistoryItem {
  from_status: string;
  to_status: string;
  action: "advance" | "reject";
  actor_id: string;
  actor_name: string;
  actor_email?: string;
  actor_role: string;
  attachment_ids?: string[];
  note?: string | null;
  created_at: string;
}

export type PayrollCommentRecipient = "hr" | "account" | "compliance" | "mp" | "md";

export interface PayrollComment {
  id: number;
  run_id: string;
  user_id: string | null;
  author_name: string;
  author_role: string;
  recipient_role: PayrollCommentRecipient | null;
  stage: string;
  kind: "comment" | "revision";
  body: string;
  created_at: string;
}

export async function getPayrollComments(runId: string, before?: number, search?: string) {
  const params = new URLSearchParams();
  if (before) params.set("before", String(before));
  if (search?.trim()) params.set("search", search.trim());
  return api.get<{ data: PayrollComment[]; has_more: boolean; can_comment: boolean }>(`/api/hr/payroll/runs/${runId}/comments${params.size ? `?${params}` : ""}`);
}

export async function postPayrollComment(runId: string, body: string, kind: PayrollComment["kind"], recipientRole: PayrollCommentRecipient) {
  return api.post<{ data: PayrollComment }>(`/api/hr/payroll/runs/${runId}/comments`, { body, kind, recipient_role: recipientRole });
}

export async function readPayrollComments(runId: string, throughId: number) {
  return api.post(`/api/hr/payroll/runs/${runId}/comments/read`, { through_id: throughId });
}

export interface PayrollOtherDeduction {
  label: string;
  amount: number;
  tax_treatment?: "post_tax" | "pre_tax";
}

export interface PayrollEntryUser {
  id: string;
  name: string;
  email: string;
  staff_id: string;
  department: string | null;
  contract_type?: string | null;
  date_joined?: string | null;
  exit_date?: string | null;
  exit_type?: string | null;
  exit_reason?: string | null;
  is_active?: boolean;
  gross_pay?: number | null;
}

export interface PayrollEntry {
  staff_review_reasons?: string[];
  id: string;
  run_id: string;
  user_id: string;
  user?: PayrollEntryUser;
  gross_salary: number;
  taxable_gross: number;
  accommodation_amount?: number;
  is_intern: boolean;
  attendance_days: number;
  half_day_count?: number;
  unapproved_leave_days?: number;
  unauthorized_late_days?: number;
  suspension_days: number;
  other_deductions_amount: number;
  other_deductions?: PayrollOtherDeduction[];
  additions_amount: number;
  additions?: PayrollOtherDeduction[];
  prorated_days: number;
  attendance_suggested_days: number;
  half_day_suggested_count?: number;
  unapproved_leave_suggested_days?: number;
  unauthorized_late_suggested_days?: number;
  compliance_suggested_days: number;
  system_suggested_days: number;
  final_deduction_days: number;
  daily_rate: number;
  deduction_amount: number;
  tax_amount: number;
  net_amount: number;
  override_note?: string | null;
  calculation_snapshot?: Record<string, any> | null;
  run?: {
    id: string;
    payroll_month: string;
    status: string;
    closed_at?: string | null;
  };
}

export interface PayrollSupportingDocument {
  id: string;
  name: string;
  size: number;
  category: "attendance" | "sanctions" | "todo_reports";
  version: number;
  uploaded_at: string;
  uploaded_by: { id: string; name: string };
  download_url: string;
}

export interface PayrollRun {
  can_upload_documents?: boolean;
  uploadable_document_categories?: PayrollSupportingDocument["category"][];
  supporting_documents?: PayrollSupportingDocument[];
  id: string;
  payroll_month: string;
  status: PayrollRunStatus;
  approval_history?: PayrollApprovalHistoryItem[];
  generated_at?: string | null;
  closed_at?: string | null;
  created_at?: string | null;
  summary?: {
    total_entries: number;
  };
  entries?: PayrollEntry[];
}

export interface MyPayrollResponse {
  payroll_month: string;
  run_status?: PayrollRunStatus | "missing";
  status?: "missing";
  entry: (PayrollEntry & { visibility?: "limited_pending" | "full" }) | null;
}

export async function listPayrollRuns(month?: string): Promise<ApiResponse<{ data: PayrollRun[] }>> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return api.get<{ data: PayrollRun[] }>(`/api/hr/payroll/runs${query}`);
}

export async function createPayrollRun(
  payrollMonth: string,
  reset: boolean = false,
  entries?: any[],
  createNext: boolean = false,
): Promise<ApiResponse<{ data: PayrollRun }>> {
  return api.post<{ data: PayrollRun }>("/api/hr/payroll/runs", {
    payroll_month: payrollMonth,
    reset: reset,
    entries: entries,
    create_next: createNext,
  });
}

export async function getPayrollRun(runId: string): Promise<ApiResponse<{ data: PayrollRun }>> {
  return api.get<{ data: PayrollRun }>(`/api/hr/payroll/runs/${runId}`);
}

export interface PayrollPreviewEntry extends Omit<PayrollEntry, 'id' | 'run_id' | 'user_id'> {
  user: PayrollEntryUser;
}

export interface PayrollPreviewResponse {
  payroll_month: string;
  entries: PayrollPreviewEntry[];
}

export async function previewPayroll(month: string, createNext = false): Promise<ApiResponse<{ data: PayrollPreviewResponse }>> {
  const query = month ? `?month=${encodeURIComponent(month)}${createNext ? '&create_next=1' : ''}` : '';
  return api.get<{ data: PayrollPreviewResponse }>(`/api/hr/payroll/preview${query}`);
}

export async function overridePayrollEntry(
  entryId: string,
  payload: {
    attendance_days?: number;
    half_day_count?: number;
    unapproved_leave_days?: number;
    unauthorized_late_days?: number;
    suspension_days?: number;
    prorated_days?: number;
    accommodation_amount?: number;
    other_deductions_amount?: number;
    other_deductions?: PayrollOtherDeduction[];
    additions_amount?: number;
    additions?: PayrollOtherDeduction[];
    final_deduction_days?: number;
    deduction_amount?: number;
    override_note?: string;
    gross_salary?: number;
    taxable_gross?: number;
    daily_rate?: number;
    tax_amount?: number;
    net_amount?: number;
    calculation_snapshot?: Record<string, any>;
  },
): Promise<ApiResponse<{ data: PayrollEntry }>> {
  return api.patch<{ data: PayrollEntry }>(`/api/hr/payroll/entries/${entryId}/override`, payload);
}

export async function recalculatePayrollEntry(entryId: string): Promise<ApiResponse<{ data: PayrollEntry }>> {
  return api.post<{ data: PayrollEntry }>(`/api/hr/payroll/entries/${entryId}/recalculate`);
}

export async function transitionPayrollRun(
  runId: string,
  action: "advance" | "reject",
  note?: string,
): Promise<ApiResponse<{ data: PayrollRun; message?: string }>> {
  return api.post<{ data: PayrollRun; message?: string }>(`/api/hr/payroll/runs/${runId}/transition`, {
    action,
    note,
  });
}

export async function reopenPayrollRun(runId: string): Promise<ApiResponse<{ data: PayrollRun }>> {
  return api.post<{ data: PayrollRun }>(`/api/hr/payroll/runs/${runId}/reopen`);
}

export async function deletePayrollRun(runId: string): Promise<ApiResponse<{ message: string }>> {
  return api.delete<{ message: string }>(`/api/hr/payroll/runs/${runId}`);
}

export async function getMyPayroll(month?: string): Promise<ApiResponse<{ data: MyPayrollResponse }>> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return api.get<{ data: MyPayrollResponse }>(`/api/my/payroll${query}`);
}

export async function getMyPayrollHistory(): Promise<ApiResponse<{ data: PayrollEntry[] }>> {
  return api.get<{ data: PayrollEntry[] }>("/api/my/payroll/history");
}

export async function refreshPayrollStaff(runId: string, entries: Record<string, unknown>[]) {
  return api.post<{ data: PayrollRun }>(`/api/hr/payroll/runs/${runId}/refresh-staff`, { entries });
}
