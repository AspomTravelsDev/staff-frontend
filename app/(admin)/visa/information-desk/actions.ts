"use server";

import { createInformationEntry, updateInformationEntry, deleteInformationEntry } from "@/lib/api/information-desk";
import type { CreateVisaInformationRequest, UpdateVisaInformationRequest } from "@/lib/api/visa";

export async function createVisaInformationAction(data: CreateVisaInformationRequest) {
  return createInformationEntry("visa", data);
}
export async function updateVisaInformationAction(id: string, data: UpdateVisaInformationRequest) {
  return updateInformationEntry("visa", id, data);
}
export async function deleteVisaInformationAction(id: string) {
  return deleteInformationEntry("visa", id);
}
