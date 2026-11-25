"use server";

import { api } from "./client";
import type {
  StandaloneBatchSendInput,
  StandaloneBatchSendResponse,
  StandaloneEmailComposer,
  StandaloneEmailInput,
  StandaloneEmailRecord,
} from "@/lib/types/standalone-recruitment-email";

export async function getStandaloneEmailComposer() {
  const response = await api.get<{ data: StandaloneEmailComposer }>("/api/recruitment/emails/composer");
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}

export async function getStandaloneEmail(id: string) {
  const response = await api.get<{ data: StandaloneEmailRecord }>(`/api/recruitment/emails/${id}`);
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}

export async function saveStandaloneEmail(id: string, input: StandaloneEmailInput) {
  const response = await api.put<{ data: StandaloneEmailRecord }>(`/api/recruitment/emails/${id}`, input);
  if (!response.success) return { success: false as const, error: response.error.error, code: response.error.code };
  return { success: true as const, data: response.data.data };
}

export async function prepareStandaloneEmail(id: string, input: StandaloneEmailInput) {
  const response = await api.post<{ data: StandaloneEmailRecord }>(`/api/recruitment/emails/${id}/prepare`, input);
  if (!response.success) return { success: false as const, error: response.error.error, code: response.error.code };
  return { success: true as const, data: response.data.data };
}

export async function sendStandaloneEmail(id: string, input: StandaloneEmailInput) {
  const response = await api.post<{ data: StandaloneEmailRecord }>(`/api/recruitment/emails/${id}/send`, input);
  if (!response.success) return { success: false as const, error: response.error.error, code: response.error.code };
  return { success: true as const, data: response.data.data };
}

export async function batchSendStandaloneEmails(input: StandaloneBatchSendInput) {
  const response = await api.post<{ data: StandaloneBatchSendResponse }>("/api/recruitment/emails/batch-send", input);
  if (!response.success) return { success: false as const, error: response.error.error, code: response.error.code };
  return { success: true as const, data: response.data.data };
}
