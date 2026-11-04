"use server";

import type { InvoiceCurrency } from "@/lib/utils/invoice-currency";
import { api } from "./client";
import type { Client } from "./crm-constants";
import type { ListResponse } from "./payment-confirmations";

export interface InvoiceItem {
  date: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string | null;
  payment_method: string | null;
  reference: string | null;
  note: string | null;
  recorded_by_id: string | null;
  recorded_by?: { id: string; name: string } | null;
  created_at: string;
}

export interface NewInvoicePayment {
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string | null;
  note?: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  currency?: InvoiceCurrency;
  currency_locked?: boolean;
  subsidiary: string;
  company_name: string;
  company_email: string | null;
  company_website: string | null;
  company_phone: string | null;
  company_address: string | null;
  bank_details: string | null;
  crm_client_id: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  issue_date: string;
  due_date: string;
  payment_method: string;
  membership_number: string | null;
  membership_points: string | null;
  membership_welcome_text: string | null;
  items: InvoiceItem[];
  subtotal: number;
  discount_type?: "none" | "fixed" | "percentage";
  discount_value?: number;
  discount_amount?: number;
  total?: number;
  deposit: number;
  balance_due: number;
  status: "paid" | "unpaid" | "partially_paid";
  terms_conditions: string | null;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  creator?: { id: string; name: string };
  last_sent_at?: string | null;
  email_status?: "not_sent" | "sending" | "sent" | "failed";
  last_sent_by_id?: string | null;
  last_sent_by?: { id: string; name: string } | null;
}

export interface InvoiceFilters {
  currency?: InvoiceCurrency;
  page?: number;
  limit?: number;
  search?: string;
  subsidiary?: string;
  status?: string;
}

export async function getInvoices(
  filters: InvoiceFilters = {}
): Promise<ListResponse<Invoice>> {
  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.set("page", filters.page.toString());
  if (filters.limit) queryParams.set("limit", filters.limit.toString());
  if (filters.search) queryParams.set("search", filters.search);
  if (filters.subsidiary) queryParams.set("subsidiary", filters.subsidiary);
  if (filters.currency) queryParams.set("currency", filters.currency);
  if (filters.status) queryParams.set("status", filters.status);

  const response = await api.get<ListResponse<Invoice>>(
    `/api/invoices?${queryParams.toString()}`
  );

  if (response.success) {
    return response.data;
  }

  console.error("Failed to fetch invoices:", response.error);
  return {
    data: [],
    pagination: { page: 1, limit: 50, total: 0, total_pages: 0 },
  };
}

export async function getInvoice(id: string): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  const response = await api.get<Invoice>(`/api/invoices/${id}`);
  if (response.success) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.error?.error || "Failed to fetch invoice" };
}

export async function createInvoice(
  data: Omit<Invoice, "id" | "created_at" | "updated_at" | "created_by_id"> & {
    payments?: NewInvoicePayment[];
  }
): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  const response = await api.post<Invoice>("/api/invoices", data);
  if (response.success) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.error?.error || "Failed to create invoice" };
}

export async function updateInvoice(
  id: string,
  data: Omit<Invoice, "id" | "created_at" | "updated_at" | "created_by_id">
): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  const response = await api.put<Invoice>(`/api/invoices/${id}`, data);
  if (response.success) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.error?.error || "Failed to update invoice" };
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await api.delete<{ message: string }>(`/api/invoices/${id}`);
  if (response.success) {
    return { success: true, message: response.data.message };
  }
  return { success: false, error: response.error?.error || "Failed to delete invoice" };
}

export interface InvoiceStats {
  totals_by_currency?: Record<InvoiceCurrency, { total_paid: number; total_unpaid: number }>;
  total_count: number;
  unique_customers_count: number;
  total_paid: number;
  total_unpaid: number;
}

export async function getInvoiceStats(): Promise<{ success: boolean; data?: InvoiceStats; error?: string }> {
  const response = await api.get<InvoiceStats>("/api/invoices/stats");
  if (response.success) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.error?.error || "Failed to fetch invoice stats" };
}

export async function sendInvoiceEmail(
  id: string,
  data: {
    pdfBase64: string;
    currency?: InvoiceCurrency;
    to: string;
    customNote?: string;
    cc?: string[];
  }
): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  const response = await api.post<{ invoice: Invoice }>(`/api/invoices/${id}/send`, data);
  if (response.success) {
    return { success: true, data: response.data.invoice };
  }
  return { success: false, error: response.error?.error || "Failed to send invoice email" };
}

export async function getInvoicePayments(id: string): Promise<{
  success: boolean;
  data?: InvoicePayment[];
  error?: string;
}> {
  const response = await api.get<InvoicePayment[]>(`/api/invoices/${id}/payments`);
  if (response.success) return { success: true, data: response.data };
  return { success: false, error: response.error?.error || "Failed to load payment history" };
}

export async function recordInvoicePayment(
  id: string,
  data: {
    amount: number;
    currency?: InvoiceCurrency;
    payment_date: string;
    payment_method: string;
    reference?: string;
    note?: string;
  }
): Promise<{
  success: boolean;
  data?: { payment: InvoicePayment; invoice: Invoice };
  error?: string;
}> {
  const response = await api.post<{ payment: InvoicePayment; invoice: Invoice }>(
    `/api/invoices/${id}/payments`,
    data
  );
  if (response.success) return { success: true, data: response.data };
  return { success: false, error: response.error?.error || "Failed to record payment" };
}
