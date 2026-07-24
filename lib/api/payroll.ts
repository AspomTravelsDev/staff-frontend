"use server";

import { api, type ApiResponse } from "@/lib/api/client";

export type PayrollRunStatus = "draft" | "processing" | "closed";
export type PayrollEntryStatus = "pending" | "approved";

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
  gross_pay?: number | null;
}

export interface PayrollEntry {
  id: string;
  run_id: string;
  user_id: string;
  user?: PayrollEntryUser;
  gross_salary: number;
  taxable_gross: number;
  accommodation_amount?: number;
  is_intern: boolean;
  attendance_days: number;
  suspension_days: number;
  other_deductions_amount: number;
  other_deductions?: PayrollOtherDeduction[];
  additions_amount: number;
  additions?: PayrollOtherDeduction[];
  prorated_days: number;
  attendance_suggested_days: number;
  compliance_suggested_days: number;
  system_suggested_days: number;
  final_deduction_days: number;
  daily_rate: number;
  deduction_amount: number;
  tax_amount: number;
  net_amount: number;
  status: PayrollEntryStatus;
  override_note?: string | null;
  approved_at?: string | null;
  calculation_snapshot?: Record<string, any> | null;
  run?: {
    id: string;
    payroll_month: string;
    status: string;
    closed_at?: string | null;
  };
}

export interface PayrollRun {
  id: string;
  payroll_month: string;
  status: PayrollRunStatus;
  generated_at?: string | null;
  closed_at?: string | null;
  created_at?: string | null;
  summary?: {
    total_entries: number;
    approved_entries: number;
    pending_entries: number;
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
): Promise<ApiResponse<{ data: PayrollRun }>> {
  return api.post<{ data: PayrollRun }>("/api/hr/payroll/runs", {
    payroll_month: payrollMonth,
    reset: reset,
    entries: entries,
  });
}

export async function getPayrollRun(runId: string): Promise<ApiResponse<{ data: PayrollRun }>> {
  return api.get<{ data: PayrollRun }>(`/api/hr/payroll/runs/${runId}`);
}

export interface PayrollPreviewEntry extends Omit<PayrollEntry, 'id' | 'run_id' | 'user_id' | 'status'> {
  user: PayrollEntryUser;
}

export interface PayrollPreviewResponse {
  payroll_month: string;
  entries: PayrollPreviewEntry[];
}

export async function previewPayroll(month: string): Promise<ApiResponse<{ data: PayrollPreviewResponse }>> {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return api.get<{ data: PayrollPreviewResponse }>(`/api/hr/payroll/preview${query}`);
}

export async function overridePayrollEntry(
  entryId: string,
  payload: {
    attendance_days?: number;
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

export async function approvePayrollEntry(entryId: string): Promise<ApiResponse<{ data: PayrollEntry }>> {
  return api.post<{ data: PayrollEntry }>(`/api/hr/payroll/entries/${entryId}/approve`);
}

export async function recalculatePayrollEntry(entryId: string): Promise<ApiResponse<{ data: PayrollEntry }>> {
  return api.post<{ data: PayrollEntry }>(`/api/hr/payroll/entries/${entryId}/recalculate`);
}

export async function closePayrollRun(runId: string): Promise<ApiResponse<{ data: PayrollRun }>> {
  return api.post<{ data: PayrollRun }>(`/api/hr/payroll/runs/${runId}/close`);
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
