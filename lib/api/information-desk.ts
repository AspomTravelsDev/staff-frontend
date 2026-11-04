"use server";

import { api } from "./client";
import { revalidatePath } from "next/cache";
import { notFound, unstable_rethrow } from "next/navigation";
import { informationDesk, type InformationDeskKind, type InformationEntry, type InformationInput, type InformationCategory } from "@/lib/information-desk";

export async function getInformationDeskEntries(desk: InformationDeskKind, filters?: { category?: InformationCategory; country?: string }) {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.country) params.set("country", filters.country);
  const response = await api.get<InformationEntry[]>(`${informationDesk(desk).resource}${params.size ? `?${params}` : ""}`);
  if (!response.success) throw new Error(response.error.error);
  return response.data;
}

export async function getInformationDeskEntry(desk: InformationDeskKind, id: string) {
  if (desk === "visa") {
    const entry = (await getInformationDeskEntries(desk)).find(item => item.id === id);
    if (!entry) notFound();
    return entry;
  }
  const response = await api.get<InformationEntry>(`${informationDesk(desk).resource}/${id}`);
  if (!response.success) {
    if (response.error.code === "HTTP_404") notFound();
    throw new Error(response.error.error);
  }
  return response.data;
}

function refresh(desk: InformationDeskKind) {
  const config = informationDesk(desk);
  revalidatePath(config.basePath); revalidatePath(config.staffPath);
}
export async function createInformationEntry(desk: InformationDeskKind, input: InformationInput) {
  try {
    const response = await api.post<InformationEntry>(informationDesk(desk).resource, input);
    if (!response.success) return { success: false as const, error: response.error.error };
    refresh(desk); return { success: true as const, data: response.data };
  } catch (error) { unstable_rethrow(error); return { success: false as const, error: error instanceof Error ? error.message : "Information could not be saved." }; }
}
export async function updateInformationEntry(desk: InformationDeskKind, id: string, input: Partial<InformationInput>) {
  try {
    const response = await api.patch<InformationEntry>(`${informationDesk(desk).resource}/${id}`, input);
    if (!response.success) return { success: false as const, error: response.error.error };
    refresh(desk); return { success: true as const, data: response.data };
  } catch (error) { unstable_rethrow(error); return { success: false as const, error: error instanceof Error ? error.message : "Information could not be updated." }; }
}
export async function deleteInformationEntry(desk: InformationDeskKind, id: string) {
  try {
    const response = await api.delete<{ success: boolean }>(`${informationDesk(desk).resource}/${id}`);
    if (!response.success) return { success: false as const, error: response.error.error };
    refresh(desk); return { success: true as const };
  } catch (error) { unstable_rethrow(error); return { success: false as const, error: error instanceof Error ? error.message : "Information could not be deleted." }; }
}

export async function createBirthServicesFile(formData: FormData) {
  try {
    const response = await api.post<InformationEntry>(`${informationDesk("birth-services").resource}/files`, formData);
    if (!response.success) return { success: false as const, error: response.error.error };
    refresh("birth-services"); return { success: true as const, data: response.data };
  } catch (error) { unstable_rethrow(error); return { success: false as const, error: error instanceof Error ? error.message : "The file could not be uploaded." }; }
}

export async function updateBirthServicesFile(id: string, formData: FormData) {
  try {
    const response = await api.post<InformationEntry>(`${informationDesk("birth-services").resource}/${id}/file`, formData);
    if (!response.success) return { success: false as const, error: response.error.error };
    refresh("birth-services"); return { success: true as const, data: response.data };
  } catch (error) { unstable_rethrow(error); return { success: false as const, error: error instanceof Error ? error.message : "The file could not be updated." }; }
}
