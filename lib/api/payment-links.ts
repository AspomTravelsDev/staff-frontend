"use server";
import { api } from "./client";
import { revalidatePath } from "next/cache";
import type { NewPaymentLink, PaymentLink, PaymentList, PaymentOptions, PublicPayment } from "@/lib/types/payment-links";

export async function getPaymentLinks(filters: Record<string, string> = {}) { return api.get<PaymentList>(`/api/payment-links?${new URLSearchParams(filters)}`); }
export async function getPaymentLinkOptions(search = "") { return api.get<PaymentOptions>(`/api/payment-links/options?search=${encodeURIComponent(search)}`); }
export async function createPaymentLink(data: NewPaymentLink) {
  const response = await api.post<{ data: PaymentLink }>("/api/payment-links", data);
  if (response.success && data.new_customer_name) { revalidatePath("/crm"); revalidatePath("/my/clients"); }
  return response;
}
export async function getPaymentLink(id: string) { return api.get<{ data: PaymentLink; through_id: number | null }>(`/api/payment-links/${id}`); }
export async function cancelPaymentLink(id: string, reason: string) { return api.post<{ message: string }>(`/api/payment-links/${id}/cancel`, { reason }); }
export async function getPaymentLinkCheckout(id: string) { return api.post<{ url: string; reference: string }>(`/api/payment-links/${id}/checkout`, {}); }
export async function sharePaymentLink(id: string, channel: "copy" | "email" | "whatsapp" | "qr", attempt_reference?: string) { return api.post<{ message: string }>(`/api/payment-links/${id}/share`, { channel, attempt_reference }); }
export async function markPaymentLinkViewed(id: string, through_id: number) { return api.post<{ message: string }>(`/api/payment-links/${id}/viewed`, { through_id }); }
export async function checkPaymentAttempt(id: string, attemptId: string) { return api.post<{ data: PaymentLink }>(`/api/payment-links/${id}/attempts/${attemptId}/check`); }
export async function exportPaymentLinks(filters: Record<string, string>) { return api.get<{ rows: Record<string, string>[] }>(`/api/payment-links/export?${new URLSearchParams(filters)}`); }
export async function getPublicPayment(token: string) { return api.get<{ data: PublicPayment }>(`/api/public/payment-links/${token}`, { skipAuth: true }); }
export async function beginPublicPayment(token: string) { return api.post<{ url: string; reference: string }>(`/api/public/payment-links/${token}/checkout`, {}, { skipAuth: true }); }
export async function verifyPublicPayment(token: string, reference: string) { return api.post<{ data: PublicPayment }>(`/api/public/payment-links/${token}/verify`, { reference }, { skipAuth: true }); }
