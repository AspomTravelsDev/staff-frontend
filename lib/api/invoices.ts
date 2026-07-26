"use server";

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

export interface Invoice {
  id: string;
  invoice_number: string;
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
  data: Omit<Invoice, "id" | "created_at" | "updated_at" | "created_by_id">
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
    to: string;
    customNote?: string;
    cc?: string[];
  }
): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  const response = await api.post<Invoice>(`/api/invoices/${id}/send`, data);
  if (response.success) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.error?.error || "Failed to send invoice email" };
}
